## Quizzy

A quizzes API server and Single Page Application powered by nodejs, vuejs and redis

### Usage

### Anatomy

#### assets

#### cli

- config.yml : configuration settings of the single page app
- helper.js : util functions
- locales.yml : localized texts
- main.js : entry point of the single page app
- store.js : shared state of the single page app

##### components

Vuejs used components

- account.vue : displays the account status (logged in)
- breadcrumb.vue : displays the breadcrumb links
- loading : loading spinner

##### views

Vuejs views

- home.vue : welcome view displayed for default routes and when not logged in
- quiz.vue : main vue that shows quiz questions and post answers to API server
- quiz-result.vue : shows the quiz result with score and evaluation if enabled in config 

