From Ubuntu 18.04 (WSL2)

Update node & npm.
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions-enterprise-linux-fedora-and-snap-packages
https://github.com/nodesource/distributions/blob/master/README.md#debinstall
Install node 12 (LTS at the moment)

```bash
$ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ node -v
v12.18.1
$ npm -v
6.14.5
```

Install vue cli

```bash
$ sudo apt-get update
$ sudo npm install -g @vue/cli @vue/cli-service-global
$ vue -V
@vue/cli 4.4.6
```

create a new project


```bash
$ vue create neo4j-vue-ui

Vue CLI v4.4.6
? Please pick a preset: Manually select features
? Check the features needed for your project:
 ◉ Babel
 ◯ TypeScript
 ◯ Progressive Web App (PWA) Support
 ◉ Router
 ◉ Vuex
❯◉ CSS Pre-processors
 ◉ Linter / Formatter
 ◉ Unit Testing
 ◯ E2E Testing

? Use history mode for router? (Requires proper server setup for index fallback in production) (Y/n) n

? Pick a CSS pre-processor (PostCSS, Autoprefixer and CSS Modules are supported by default): (Use arrow keys)
❯ Sass/SCSS (with dart-sass)
  Sass/SCSS (with node-sass)
  Less
  Stylus

❯ ESLint with error prevention only
  ESLint + Airbnb config
  ESLint + Standard config
  ESLint + Prettier


? Pick additional lint features: (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯◉ Lint on save
 ◯ Lint and fix on commit

? Pick a unit testing solution: (Use arrow keys)
❯ Mocha + Chai
  Jest


? Where do you prefer placing config for Babel, ESLint, etc.? (Use arrow keys)
❯ In dedicated config files
  In package.json

? Save this as a preset for future projects? (y/N)

```


# Login

Function that takes username and password and encode them so they can be passed as `"Authentication: Basic {encodedCredentials}"` header.

The thing is stored in localstorage.


```js
function login(username, password) {

    return new Promise(function (resolve) {
        const user = { username, authdata: window.btoa(username + ':' + password) }
        localStorage.setItem('user', JSON.stringify(user));
        resolve(user);
    })
}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
}

```


Router conf to prevent acces without auth.

```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import LoginPage from '../login/LoginPage.vue'

Vue.use(VueRouter)

export const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },
        {
            path: '/login',
            name: 'Login',
            component: LoginPage
        },
        {
            path: '/about',
            name: 'About',
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    // redirect to login page if not logged in and trying to access a restricted page
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);
    const loggedIn = localStorage.getItem('user');

    if (authRequired && !loggedIn) {
        return next({
            path: '/login',
            query: { returnUrl: to.path }
        });
    }

    next();
})

export default router
```

Function that will be used later to add authorization header to Neo4j API calls.

```js
export function authHeader() {
    // return authorization header with basic auth credentials
    let user = JSON.parse(localStorage.getItem('user'));

    if (user && user.authdata) {
        return { 'Authorization': 'Basic ' + user.authdata };
    } else {
        return {};
    }
}
```

# Neo4j api call

We assume that neo4j is running locally and accepts connections from other domains. Also that it is secured.
We won't use https for now. 

REST API entry points.

https://neo4j.com/docs/http-api/current/

https://neo4j.com/docs/http-api/current/actions/

```bash
$ curl -X GET http://localhost:7474/ \
  -H "Accept: application/json;charset=UTF-8" \
  -H "Authorization: Basic bmVvNGo6ZWFlcWdoejY0"

{
  "bolt_routing" : "neo4j://localhost:7687",
  "transaction" : "http://localhost:7474/db/{databaseName}/tx",
  "bolt_direct" : "bolt://localhost:7687",
  "neo4j_version" : "4.1.0",
  "neo4j_edition" : "enterprise"
```

Begin a transaction.


For example sake, we create it without statements. We could add multiple statements in the same transaction.

You can also begin and end a transaction in one http request (http://localhost:7474/db/neo4j/tx/commit)

```bash
curl -X POST http://localhost:7474/db/neo4j/tx \
  -H "Accept: application/json;charset=UTF-8" \
  -H "Authorization: Basic bmVvNGo6ZWFlcWdoejY0" \
  -H "Content-Type: application/json;charset=utf-8" \
  --data '{"statements":[]}' \
  -v
```

A new transaction is created, without activity on it, it will be destroyed in 60sec.

```
< HTTP/1.1 201 Created
< Date: Sun, 28 Jun 2020 16:08:57 GMT
< Access-Control-Allow-Origin: *
< Location: http://localhost:7474/db/neo4j/tx/1
< Content-Type: application/json;charset=utf-8
< Content-Length: 138
< 
* Connection #0 to host localhost left intact
{"results":[],"errors":[],"commit":"http://localhost:7474/db/neo4j/tx/1/commit","transaction":{"expires":"Sun, 28 Jun 2020 16:09:57 GMT"}}
```

Location header gives us the URL of the created transaction : `http://localhost:7474/db/neo4j/tx/1` 

```bash
curl -X POST http://localhost:7474/db/neo4j/tx/1 \
  -H "Accept: application/json;charset=UTF-8" \
  -H "Authorization: Basic bmVvNGo6ZWFlcWdoejY0" \
  -H "Content-Type: application/json;charset=utf-8" \
  --data '{  "statements" : [ {    "statement" : "MATCH (n) RETURN n LIMIT 25"  } ]}' \
  -v
```

```
< HTTP/1.1 200 OK
< Date: Sun, 28 Jun 2020 16:14:05 GMT
< Access-Control-Allow-Origin: *
< Content-Type: application/json;charset=utf-8
< Content-Length: 1265
< 
{"results":[{"columns":["n"],"data":[{"row":[{"name":"Devenir freelance"}],"meta":[{"id":0,"type":"node","deleted":false}]},{"row":[{"date":"2020-06-27T14:29:57.283Z","name":"Situation Actuelle"}],"meta":[{"id":1,"type":"node","deleted":false}]},{"row":[{"name":"Inconnues","unknown":true}],"meta":[{"id":2,"type":"node","deleted":false}]},{"row":[{"name":"TDAH"}],"meta":[{"id":3,"type":"node","deleted":false}]},{"row":[{"name":"Motivation"}],"meta":[{"id":4,"type":"node","deleted":false}]},{"row":[{"name":"Santé mentale"}],"meta":[{"id":5,"type":"node","deleted":false}]},{"row":[{"name":"Confiance en soi"}],"meta":[{"id":6,"type":"node","deleted":false}]},{"row":[{"name":"Affirmation de soi"}],"meta":[{"id":7,"type":"node","deleted":false}]},{"row":[{"name":"Marc"}],"meta":[{"id":8,"type":"node","deleted":false}]},{"row":[{"name":"Technical"}],"meta":[{"id":9,"type":"node","deleted":false}]},{"row":[{"name":"Soft-skill"}],"meta":[{"id":10,"type":"node","deleted":false}]},{"row":[{"name":"Java"}],"meta":[{"id"* Connection #0 to host localhost left intact
:11,"type":"node","deleted":false}]},{"row":[{"name":"Java 7"}],"meta":[{"id":12,"type":"node","deleted":false}]}]}],"errors":[],"commit":"http://localhost:7474/db/neo4j/tx/1/commit","transaction":{"expires":"Sun, 28 Jun 2020 16:15:05 GMT"}}
```


```bash
curl -X POST http://localhost:7474/db/neo4j/tx/1/commit \
  -H "Accept: application/json;charset=UTF-8" \
  -H "Authorization: Basic bmVvNGo6ZWFlcWdoejY0" \
  -H "Content-Type: application/json;charset=utf-8" \
  --data '{  "statements" : []}' \
  -v
```

```
< HTTP/1.1 200 OK
< Date: Sun, 28 Jun 2020 16:16:23 GMT
< Access-Control-Allow-Origin: *
< Content-Type: application/json;charset=utf-8
< Content-Length: 80
< 
* Connection #0 to host localhost left intact
{"results":[],"errors":[],"commit":"http://localhost:7474/db/neo4j/tx/1/commit"}
```

# Wrapping Neo4j REST API in vuejs

```js
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
```

Usage sample

```js
import {openTransaction,loadExistingNodeLabels}  from  '../_services/neo4j.service'
export default {
  name: "NodeCreator",
  props: {
    msg: String
  },
  data() {
    return {
      neo4jConfig: { transactionRouteUrl: "http://localhost:7474/db/neo4j/tx" },
      transaction: { commitUrl: null, url: null, running: false },
      node: { isInCreation: false, existingLabels: [], selectedLabel: null }
    };
  },
  methods: {
    newNode() {
      const component = this;
      component.node.isInCreation = true;
      openTransaction(this.neo4jConfig.transactionRouteUrl).then(({commitUrl,url}) => {
        component.transaction.commitUrl = commitUrl
        component.transaction.running=true
        component.transaction.url=url
        console.log("Transaction created : ", component.transaction.url);
        
        // fetch labels
        loadExistingNodeLabels(component.transaction.url)
        .then(data => {
          component.node.existingLabels = data;
        });
      })
      .catch(()=>{
          component.transaction.running = true; // to refresh transaction while it is running
          component.isInCreation=false
      })
    },
    commitNode() {
      // endTransaction
    },
  }
};
```