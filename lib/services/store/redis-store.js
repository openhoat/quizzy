const Promise = require('bluebird')
const _ = require('lodash')
//const log = require('hw-logger').log
const Store = require('../store')
const RedisCli = require('../redis-cli')
const helper = require('../../helper')

class RedisStore extends Store {

  static getKey(...key) {
    return key.join(':')
  }

  constructor(config) {
    super(config)
    this.name = 'redis'
  }

  init() {
    this.redis = RedisCli(_.get(this, 'config.redis'))
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

  getQuizzes() {
    return Promise.resolve()
      .then(() => {
        const key = this.redis.config.prefix + RedisStore.getKey('quizzes', '*')
        return this.redis.exec('keys', key)
          .map(key => this.redis
            .exec('get', key.substring(this.redis.config.prefix.length))
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
        const key = RedisStore.getKey('quizzes', quiz.id)
        return this.redis.exec('set', key, JSON.stringify(quiz))
      })
      .return(quiz)
  }

  getQuiz(quizId) {
    const key = RedisStore.getKey('quizzes', quizId)
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
    const key = RedisStore.getKey('sessions', session.id)
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

  getSessions() {
    const key = this.redis.config.prefix + RedisStore.getKey('sessions', '*')
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
      .then(() => this.redis.exec('keys', key))
      .map(key => this.redis.exec('get', key.substring(this.redis.config.prefix.length))
        .then(data => JSON.parse(data))
      )
      .then(sessions => helper.clone(sessions))
  }

  findSessions(email, quizId) {
    const key = this.redis.config.prefix + RedisStore.getKey('sessions', email, quizId || '*')
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
      .then(() => this.redis.exec('keys', key))
      .map(key => this.redis.exec('get', key.substring(this.redis.config.prefix.length))
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

  deleteSession(email, quizId) {
    return this.findSessions(email, quizId)
      .then(session => {
        const key = RedisStore.getKey('sessions', session.id)
        return this.redis.exec('del', key)
      })
  }

  deleteAll() {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          throw new Store.errors.NotStartedError()
        }
      })
      .then(() => this.redis.exec('keys', this.redis.config.prefix + RedisStore.getKey('*')))
      .each(key => this.redis.exec('del', key.substring(this.redis.config.prefix.length)))
  }

}

module.exports = RedisStore
