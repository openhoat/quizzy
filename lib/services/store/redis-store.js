const Promise = require('bluebird')
const _ = require('lodash')
//const log = require('hw-logger').log
const Store = require('../store')
const RedisCli = require('../redis-cli')
const helper = require('../../helper')

class RedisStore extends Store {

  constructor(config) {
    super(config)
    this.name = 'redis'
  }

  init() {
    this.redis = RedisCli(this.config.redis)
    super.init()
  }

  start(config) {
    return Promise.resolve()
      .then(() => {
        if (!this.initialized) {
          this.init(config)
        }
      })
      .then(() => this.redis.start())
      .then(() => {
        this.started = true
      })
  }

  stop() {
    return this.redis.stop()
      .then(() => {
        this.started = false
      })
  }

  getKey(...key) {
    const rootKey = _.get(this, 'config.redis.rootKey')
    return (rootKey ? [rootKey] : []).concat(key).join(':')
  }

  getQuizzes() {
    return Promise.resolve()
      .then(() => {
        const key = this.getKey('quizzes', '*')
        return this.redis.exec('keys', key)
          .map(key => this.redis
            .exec('get', key)
            .then(quiz => _.pick(JSON.parse(quiz), ['id', 'title', 'description']))
          )
      }).then(quizzes => _.sortBy(quizzes, 'title'))
  }

  saveQuiz(quiz) {
    quiz = helper.clone(quiz)
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        this.validateQuiz(quiz)
        const key = this.getKey('quizzes', quiz.id)
        return this.redis.exec('set', key, JSON.stringify(quiz))
      })
      .return(quiz)
  }

  getQuiz(quizId) {
    const key = this.getKey('quizzes', quizId)
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
      .then(() => this.redis.exec('get', key))
      .then(quiz => {
        if (!quiz) {
          throw new Store.errors.NotFoundError()
        }
        return JSON.parse(quiz)
      })
  }

  saveSession(session) {
    const key = this.getKey('sessions', session.id)
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
        this.validateSession(session)
        return this.redis.exec('set', key, JSON.stringify(session))
      })
      .return(session)
  }

  findSessions(email, quizId) {
    const key = this.getKey('sessions', email, quizId || '*')
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
      .then(() => this.redis.exec('keys', key))
      .map(key => this.redis.exec('get', key)
        .then(data => JSON.parse(data))
      )
      .then(sessions => {
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
      .then(() => this.redis.exec('keys', this.getKey('*')))
      .each(key => this.redis.exec('del', key))
  }

}

module.exports = RedisStore
