import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    quizzes: null,
    quiz: null,
    sessions: null,
    quizId: null,
  },
  mutations: {
    addSession(state, session) {
      state.sessions = state.sessions || []
      state.sessions.push(session)
    },
    clearUser(state) {
      state.user = null
    },
    setQuiz(state, quiz) {
      state.quiz = quiz
    },
    setQuizId(state, quizId) {
      state.quizId = quizId
    },
    setQuizzes(state, quizzes) {
      state.quizzes = quizzes
    },
    setSessions(state, sessions) {
      state.sessions = sessions
    },
    setUser(state, user) {
      state.user = user
    },
  }
})
