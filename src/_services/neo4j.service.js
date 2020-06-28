import { authHeader } from '../_helpers/auth-header'


function defaultHeaders() {
    const headers = new Headers();
    headers.append("Authorization", authHeader());
    headers.append("Accept", "application/json;charset=UTF-8");
    headers.append("Content-Type", "application/json;charset=UTF-8");
    return headers;
}

function openTransaction(transactionRouteUrl) {
    const headers = defaultHeaders();
    const request = new Request(transactionRouteUrl, {
        method: "POST",
        body: '{"statements":[]}',
        headers
    });


    return fetch(request)
        .then(response => {
            return response.json();
        })
        .then(data => {

            const url = data.commit.split("/commit")[0]; // normally it's in reponse's location header, but for some reason I can't get this header's value with fetch()

            return { commitUrl: data.commit, url }
        })
}

function loadExistingNodeLabels(transactionUrl) {
    const headers = defaultHeaders();

    const request = new Request(transactionUrl, {
        method: "POST",
        body: JSON.stringify({
            statements: [{ statement: "call db.labels()" }]
        }),
        headers
    });

    return fetch(request)
        .then(response => {
            console.log("labels response :", response);
            return response.json();
        })
        .then(json => {
            console.log("labels data :", json);
            return json.results[0].data.map(it => it.row[0]);
        });
}

export {
    defaultHeaders, openTransaction, loadExistingNodeLabels
};
