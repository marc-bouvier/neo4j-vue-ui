export const userService = {
    login,
    logout
};

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
