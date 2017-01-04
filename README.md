[![NPM version](https://badge.fury.io/js/quizzy.svg)](http://badge.fury.io/js/quizzy)
[![Build Status](https://travis-ci.org/openhoat/quizzy.png?branch=master)](https://travis-ci.org/openhoat/quizzy)
[![Coverage Status](https://coveralls.io/repos/github/openhoat/quizzy/badge.svg?branch=master)](https://coveralls.io/github/openhoat/quizzy?branch=master)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)]()

## Quizzy

A simple quizzes API server and [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application) powered by [Nodejs](https://nodejs.org/en/), [Expressjs](http://expressjs.com/), [Vuejs](https://vuejs.org/) and [Redis](https://redis.io/).

### Prerequisite

#### [Install NodeJS](https://nodejs.org/en/download/package-manager/)

#### Install dependencies :

```
$ npm install
```

or

```
$ yarn
```

### Usage

#### Build the cli bundle :

```
$ npm run build
```

Note :
- The bundle file is created into dist/app directory
- if NODE_ENV is set to production, the bundle is uglyfied/minified without sourcemaps.

#### Start the server :

```
$ npm start
```

Note : if NODE_ENV is set to development, the server is started with nodemon and webpack middleware is used to hot reload the cli.

### Features :

- Play a quiz session with the SPA
- Sign in with your Google, Twitter, or Facebook account
- Create and manage quizzes and sessions via APIs
- i18n compliant

### Anatomy of the project

Help about the project structure
 
#### assets

Static assets (css, images, ...)

#### cli

This directory contains all the Single Page Application code powered by Vuejs.

The client part is based on VueJS with vue-i18n, vue-router, and vuex (it can also be used as a boilerplate project for VueJS)

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

##### config

##### routes

Contains all the routes exposed by the express app, including APIs and OAuth2 endpoints

##### schemas

Contains all the JSON schemas of entities, in YAML format.

##### services

- store : Used to store the data model (quizzes and sessions) into memory or redis (feel free to code another implementation)
    - index.js : Generic store interface
    - memory-store.js : Simple store implementation in-memory
    - redis-store.js : Store implementation for a Redis database server
- body-parser.js : Extended body parser compatible with JSON or YAML payload
- errors.js : Custom error classes used in the project
- json-validator.js : JSON schema validator used by the store to validate entities before persist them
- redis-cli.js : A simple Redis client
- view-renderer.js : HTML view renderer used by the express app

##### config.js

Configuration loader

##### helper.js

Util functions

##### quizzy.js

Main module of the app. It exports an express app if required by another module else it runs the server.

#### test

Unit tests in the form of mocha specs

#### views

Expressjs views used to render HTML pages

@tocomplete

Enjoy !
