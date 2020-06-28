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

