<template>
  <div>
    <account></account>
    <h3>
      {{ $t('sessionsPerQuiz') }}
      <button :title="$t('refresh')" type="button" class="btn btn-primary" v-on:click="refresh()">
        <span class="glyphicon glyphicon-refresh"></span>
      </button>
    </h3>
    <div v-if="quizzes">
      <table class="table table-striped table-hover" v-if="quizzes">
        <thead>
        <tr>
          <th>Sessions</th>
          <th>Title</th>
          <th>Description</th>
        </tr>
        </thead>
        <tbody>
        <tr class="clickable" v-for="quiz in quizzes" v-on:click="select(quiz.id)"
            :title="$t('seeQuizSessions', {quiz: quiz.id})">
          <td>
            <span class="badge" v-if="quiz.sessions">{{ quiz.sessions.length || 0 }}
            </span>
          </td>
          <td v-html="quiz.title"></td>
          <td v-html="quiz.description"></td>
        </tr>
        </tbody>
      </table>
      <p v-else>{{ $t('noItems') }}</p>
    </div>
    <loading v-else></loading>
  </div>
</template>

<script type="text/ecmascript-6">
  import $ from 'jquery'
  import store from '../../store'
  import helper from '../../helper'
  export default {
    data(){
      return {
        quizzes: null,
        sessions: null,
      }
    },
    methods: {
      refresh() {
        Promise.all([helper.fetchQuizzes(), helper.fetchQuizSessions()])
            .then(values => {
              const quizzes = values.shift()
              const sessions = values.shift()
              this.sessions = sessions
              sessions.forEach(session => {
                const quizId = session.quizId
                const quiz = _.find(quizzes, {id: quizId})
                quiz.sessions = quiz.sessions || []
                quiz.sessions.push(session)
              })
              this.quizzes = quizzes
            })
      },
      select(quizId) {
        return this.$router.push(`/admin/sessions/${quizId}`)
      }
    },
    created() {
      if (!store.state.user || !store.state.user.admin) {
        return this.$router.replace('/')
      }
      this.refresh()
    },
  }
</script>
