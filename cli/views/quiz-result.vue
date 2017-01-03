<template>
  <div>
    <account></account>
    <div>
      <p v-html="$t('resultMessage', {quiz: quiz.title})"></p>
      <div v-if="showResult && session">
        <h3>{{ $t('yourQuizResult') }} : <strong>{{ quiz.title }}</strong></h3>
        <h4>
          <dl class="list-group dl-horizontal">
            <dt>{{ $t('score') }} :</dt>
            <dd>
              <strong>{{ session.score }}</strong> / {{ session.max }}
            </dd>
            <dt v-if="session.result">{{ $t('evaluation') }} :</dt>
            <dd v-if="session.result" v-html="session.result"></dd>
          </dl>
        </h4>
      </div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import store from '../store'
  import config from 'json!yaml!../config.yml'
  export default {
    data() {
      return {session: null}
    },
    computed: {
      quiz: () => store.state.quiz,
      showResult: () => config.showResult,
    },
    created() {
      if (!store.state.user || !store.state.sessions || !store.state.quiz) {
        return this.$router.replace('/')
      }
      const quizId = store.state.quiz.id
      const session = store.state.sessions.filter(session => session.quizId === quizId)[0]
      if (!session) {
        return this.$router.replace('/')
      }
      this.session = session
    },
  }
</script>
