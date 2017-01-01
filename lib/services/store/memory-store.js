const Promise = require('bluebird')
const _ = require('lodash')
//const log = require('hw-logger').log
const Store = require('../store')
const helper = require('../../helper')

class MemoryStore extends Store {

  constructor(config) {
    super(config)
    this.name = 'memory'
  }

  init() {
    this.initData()
  }

  initData() {
    this.data = process.env.NODE_ENV === 'development' ? {
      quizzes: {
        president: {
          id: 'president',
          title: 'President Quiz',
          description: 'Questions about presidents of the USA',
          questions: [{
            title: 'Who was the only President to serve more than two terms?',
            choices: [{
              value: 'Franklin D. Roosevelt',
              score: 1
            }, {
              value: 'Theodore Roosevelt'
            }, {
              value: 'Ulysses S. Grant'
            }, {
              value: 'George Washington'
            }]
          }],
          results: {
            0: "You're too bad",
            1: 'Well done!',
          }
        }
      }
    } : {}
  }

  start(config) {
    return Promise.resolve()
      .then(() => {
        if (!this.initialized) {
          this.init(config)
        }
        this.started = true
      })
  }

  stop() {
    this.initData()
    this.started = false
  }

  getQuizzes() {
    return Promise.resolve(_.chain(this.data)
      .get('quizzes', {})
      .mapValues(value => _.pick(value, ['id', 'title', 'description']))
      .values()
      .sortBy('title')
      .value()
    )
  }

  saveQuiz(quiz) {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        this.validateQuiz(quiz)
        _.set(this.data, `quizzes.${quiz.id}`, helper.clone(quiz))
        return helper.clone(quiz)
      })
  }

  getQuiz(quizId) {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        const quiz = helper.clone(_.get(this.data, `quizzes.${quizId}`))
        if (!quiz) {
          throw new Store.errors.NotFoundError()
        }
        return quiz
      })
  }

  saveSession(session) {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        this.validateSession(session)
        this.data.sessions = this.data.sessions || []
        this.data.sessions.push(session)
        return helper.clone(session)
      })
  }

  findSessions(email, quizId) {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        const criteria = {user: {email}}
        if (quizId) {
          criteria.quizId = quizId
        }
        const sessions = _.filter(this.data.sessions, criteria)
        if (quizId) {
          if (!sessions.length) {
            throw new Store.errors.NotFoundError()
          }
          const session = sessions[0]
          return helper.clone(session)
        }
        return helper.clone(sessions)
      })
  }

  deleteAll() {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
  }

}

module.exports = MemoryStore
