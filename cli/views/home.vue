<template>
  <div>
    <account></account>
    <div v-if="user">
      <h3>
        {{ $t('welcome', {username: user.name}) }}
      </h3>
      <div v-if="quizzes">
        <div v-if="quizzes.length">
          <h4>{{ $t('selectQuiz') }}</h4>
          <dl class="list-group dl-horizontal">
            <a class="list-group-item" type="button" v-for="quiz in quizzes"
               :title="$t('playWithQuiz', {name: quiz.title})" :href="`#/quizzes/${quiz.id}`">
              <dt v-html="quiz.title"></dt>
              <dd v-html="quiz.description"></dd>
            </a>
          </dl>
        </div>
        <div v-else>
          {{ $t('sorryNoMoreQuiz') }}
        </div>
      </div>
      <loading v-else></loading>
    </div>
    <div v-else>
      <p>{{ $t('pleaseSignIn') }}</p>
      <div class="btn-group" role="group">
        <a v-bind:href="googleSigninUrl" class="btn btn-block btn-social btn-google"
           :title="$t('signInWith', {provider: 'Google'})">
          <span class="fa fa-google"></span> {{ $t('signInWith', {provider: 'Google'}) }}
        </a>
        <a v-bind:href="facebookSigninUrl" class="btn btn-block btn-social btn-facebook"
           :title="$t('signInWith', {provider: 'Facebook'})">
          <span class="fa fa-facebook"></span> {{ $t('signInWith', {provider: 'Facebook'}) }}
        </a>
        <a v-bind:href="twitterSigninUrl" class="btn btn-block btn-social btn-twitter"
           :title="$t('signInWith', {provider: 'Twitter'})">
          <span class="fa fa-twitter"></span> {{ $t('signInWith', {provider: 'Twitter'}) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import helper from '../helper'
  import store from '../store'
  export default {
    computed: {
      user: () => store.state.user,
      quizzes: () => store.state.quizzes,
      googleSigninUrl: () => helper.getApiUrl('/auth/google'),
      facebookSigninUrl: () => helper.getApiUrl('/auth/facebook'),
      twitterSigninUrl: () => helper.getApiUrl('/auth/twitter'),
    },
    created() {
      if (!store.state.user) {
        return
      }
      Promise.all([helper.fetchQuizzes(), helper.fetchQuizSessions()])
          .then(values => {
            let quizzes = values.shift()
            if (store.state.quizId) {
              quizzes = quizzes.filter(quiz => quiz.id === store.state.quizId)
            }
            let sessions = values.shift()
            sessions = sessions.filter(session => session.user.email === store.state.user.email)
            store.commit('setSessions', sessions)
            sessions.forEach(session => {
              quizzes = quizzes.filter(quiz => quiz.id !== session.quizId)
            })
            store.commit('setQuizzes', quizzes)
          })
    },
  }
</script>
