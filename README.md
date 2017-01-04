## Quizzy

A simple quizzes API server and [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application) powered by [Nodejs](https://nodejs.org/en/), [Expressjs](http://expressjs.com/), [Vuejs](https://vuejs.org/) and [Redis](https://redis.io/).

### Usage

Build the cli bundle :

```
$ npm run build
```

Note :
- The bundle file is created into dist/app directory
- if NODE_ENV is set to production, the bundle is uglyfied/minified without sourcemaps.

Start the server :

```
$ npm start
```

Note : if NODE_ENV is set to development, the server is started with nodemon and webpack middleware is used to hot reload the cli.

### Anatomy

Help about the project structure
 
#### assets

Static assets (css, images, ...)

#### cli

This directory contains all the Single Page Application code powered by Vuejs.

- [config.yml](cli/config.yml) : configuration settings of the single page app
- [helper.js](cli/helper.js) : util functions
- [locales.yml](cli/locales.yml) : localized texts ([vue-i18n](https://www.npmjs.com/package/vue-i18n))
- [main.js](cli/main.js) : entry point of the single page app
- [store.js](cli/store.js) : shared state of the single page app ([vuex](https://www.npmjs.com/package/vuex))

##### components

Vuejs used components

- [account.vue](cli/components/account.vue) : displays the account status (logged in)
- [breadcrumb.vue](cli/components/breadcrumb.vue) : displays the breadcrumb links
- [loading.vue](cli/components/loading.vue) : loading spinner

##### css

- [style.css](cli/css/style.css) : styles applied to the single page app

##### views

Vuejs views

- [home.vue](cli/views/home.vue) : welcome view displayed for default routes and when not logged in
- [quiz.vue](cli/views/quiz.vue) : main vue that shows quiz questions and post answers to API server
- [quiz-result.vue](cli/views/quiz-result.vue) : shows the quiz result with score and evaluation if enabled in config 

#### lib

This directory contains all the server code powered by Nodejs.

#### test

Unit tests in the form of mocha specs

#### views

Expressjs views used to render HTML pages


Enjoy !
