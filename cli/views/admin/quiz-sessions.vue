<template>
  <div>
    <account></account>
    <h3>
      {{ $t('sessionsOfQuiz', {quiz: quizId}) }}
      <button :title="$t('refresh')" type="button" class="btn btn-primary" v-on:click="refresh()">
        <span class="glyphicon glyphicon-refresh"></span>
      </button>
    </h3>
    <div v-if="sessions">
      <table class="table table-hover" v-if="sessions.length">
        <thead>
        <tr>
          <th>Email</th>
          <th>Score</th>
          <th>Evaluation</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(session, index) in sessions">
          <td><a title="See details" :href="`#/admin/sessions/${session.quizId}/${session.user.email}`">{{
            session.user.email }}</a></td>
          <td>{{ session.score }}/{{ session.max }}</td>
          <td v-html="session.result"></td>
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
        sessions: null,
      }
    },
    computed: {
      quizId() {
        return this.$route.params.id
      },
    },
    methods: {
      refresh(){
        const quizId = this.$route.params.id
        helper.fetchQuizSessions()
            .then(sessions => sessions.filter(session => session.quizId === quizId))
            .then(sessions => {
              this.sessions = Array.isArray(sessions) ? sessions : [sessions]
            }, (jqXHR, textStatus, errorThrown) => {
              console.warn(textStatus)
              this.sessions = []
            })
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
