import $ from 'jquery'
import _ from 'lodash'
import Cookies from 'js-cookie'

const helper = {
  clearQuizAnswer: quizId => {
    const answers = helper.getQuizAnswers()
    delete answers[quizId]
    localStorage.setItem('answers', JSON.stringify(answers))
  },
  deleteCookies: () => {
    Cookies.remove('quizzy-token')
    Cookies.remove('quizzy-user')
  },
  fetchQuiz: quizId => $.ajax(helper.withAuthorization({
    type: 'get',
    url: helper.getApiUrl(`/quizzes/${quizId}`),
    dataType: 'json',
    crossDomain: true,
  })),
  fetchQuizzes: () => $.ajax({
    type: 'get',
    url: helper.getApiUrl('/quizzes'),
    dataType: 'json',
    crossDomain: true,
  }),
  fetchQuizSessions: () => $.ajax(helper.withAuthorization({
    type: 'get',
    url: helper.getApiUrl('/sessions'),
    dataType: 'json',
    crossDomain: true,
  })),
  getApiUrl: url => {
    const baseUrl = helper.getBaseUrl()
    url = url.split('/').filter(item => item).join('/')
    return `${baseUrl}/api/${url}`
  },
  getBaseUrl: () => {
    const urlParts = location.href.split('/')
    const protocol = urlParts[0]
    const host = urlParts[2]
    return protocol + '//' + host
  },
  getQuizAnswers: quiz => {
    if (!quiz) {
      return JSON.parse(localStorage.getItem('answers') || '{}')
    }
    const answers = helper.getQuizAnswers()
    const quizAnswers = _.get(answers, typeof quiz === 'string' ? quiz : quiz.id, [])
    return quizAnswers
  },
  getToken: () => Cookies.get('quizzy-token'),
  getUser: () => {
    const user = Cookies.get('quizzy-token') && Cookies.get('quizzy-user')
    return user && JSON.parse(user)
  },
  isQuizCompleted: quiz => {
    const quizAnswers = helper.getQuizAnswers(quiz)
    return quizAnswers.length >= quiz.questions.length
  },
  postQuizSession: (quizId, answers) => $.ajax(helper.withAuthorization({
    type: 'post',
    url: helper.getApiUrl('/sessions'),
    headers: {
      'Content-Type': 'application/json',
    },
    dataType: 'json',
    data: JSON.stringify({quizId, answers}),
    crossDomain: true,
  })),
  setQuizAnswer: (quizId, questionIndex, value) => {
    const answers = helper.getQuizAnswers()
    answers[quizId] = answers[quizId] || []
    if (questionIndex <= answers[quizId].length) {
      answers[quizId][questionIndex - 1] = value
    } else {
      answers[quizId].push(value)
    }
    localStorage.setItem('answers', JSON.stringify(answers))
  },
  withAuthorization: opt => {
    const token = helper.getToken()
    if (token) {
      opt.headers = opt.headers || {}
      opt.headers.Authorization = `JWT ${token}`
    }
    return opt
  },
}

exports = module.exports = helper
