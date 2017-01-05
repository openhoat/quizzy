const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const helper = require('../../helper')
const JsonValidator = require('./../json-validator')

class NotYetImplementedError extends helper.ExtendableError {
  constructor() {
    super('Not yet implemented')
  }
}

class NotFoundError extends helper.ExtendableError {
  constructor() {
    super('Not found')
  }
}

class NotStartedError extends helper.ExtendableError {
  constructor() {
    super('Not started')
  }
}

class Store {

  constructor(config) {
    this.config = Object.assign({schemasDir: path.resolve(__dirname, '../../schemas')}, config)
    this.jsonValidator = JsonValidator({schemas: this.config.schemas, baseDir: this.config.schemasDir})
    this.errors = Store.errors
  }

  init() {
    this.initialized = true
  }

  start() {
    return Promise.reject(new NotYetImplementedError())
  }

  stop() {
    return Promise.reject(new NotYetImplementedError())
  }

  getQuizzes() {
    return Promise.reject(new NotYetImplementedError())
  }

  saveQuiz(quiz) {
    return Promise.reject(new NotYetImplementedError())
  }

  getQuiz(quizId, withScores = true) {
    return Promise.reject(new NotYetImplementedError())
  }

  saveSession(quizId, session) {
    return Promise.reject(new NotYetImplementedError())
  }

  findSessions(email, quizId) {
    return Promise.reject(new NotYetImplementedError())
  }

  deleteSession(email, quizId) {
    return Promise.reject(new NotYetImplementedError())
  }

  deleteAll() {
    return Promise.reject(new NotYetImplementedError())
  }

  validateQuiz(quiz) {
    return this.jsonValidator.validate(quiz, '/Quiz')
  }

  validateAnswers(answers) {
    return this.jsonValidator.validate(answers, '/Answers')
  }

  validateSession(session) {
    return this.jsonValidator.validate(session, '/Session')
  }

}

[NotYetImplementedError, NotFoundError, NotStartedError].forEach(errorClass => {
  _.set(Store, ['errors', errorClass.name], errorClass)
})

Store.create = (type, config) => {
  const storeClass = typeof type === 'object' ? type : require(`./${type}-store.js`)
  return new storeClass(config)
}

module.exports = Store
