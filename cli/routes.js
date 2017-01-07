// App views
import Home from './views/home.vue'
import QuizGame from './views/quiz-game.vue'
import QuizGameResult from './views/quiz-game-result.vue'
import AdminSessions from './views/admin/sessions.vue'
import AdminQuizSessions from './views/admin/quiz-sessions.vue'
import SessionDetails from './views/admin/session-details.vue'

// Routes
export default [
  {path: '/', component: Home},
  {path: '/quizzes/:id', component: QuizGame},
  {path: '/quizzes/:id/result', component: QuizGameResult},
  {path: '/admin/sessions', component: AdminSessions},
  {path: '/admin/sessions/:id', component: AdminQuizSessions},
  {path: '/admin/sessions/:id/:email', component: SessionDetails},
  {path: '/admin', redirect: {path: '/admin/sessions'}},
  {path: '*', redirect: {path: '/'}},
]
