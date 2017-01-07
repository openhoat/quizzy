<template>
  <div>
    <account></account>
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
      <p v-else>
        {{ $t('noSession') }}
      </p>
    </div>
    <loading v-else></loading>
  </div>
</template>

<script type="text/ecmascript-6">
  import $ from 'jquery'
  import store from '../../store'
  import helper from '../../helper'
  export default {
    computed: {
      sessions: () => store.state.sessions,
    },
    created() {
      if (!store.state.user || !store.state.user.admin) {
        return this.$router.replace('/')
      }
      store.commit('clearSessions')
      const quizId = this.$route.params.id
      helper.fetchQuizSessions()
          .then(sessions => sessions.filter(session => session.quizId === quizId))
          .then(sessions => {
            store.commit('setSessions', Array.isArray(sessions) ? sessions : [sessions])
          }, (jqXHR, textStatus, errorThrown) => {
            console.warn(textStatus)
            store.commit('setSessions', [])
          })
    },
  }
</script>
