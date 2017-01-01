const express = require('express')
const _ = require('lodash')
const moment = require('moment')
const bodyParser = require('../../services/body-parser')
const helper = require('../../helper')
//const log = require('hw-logger').log

module.exports = store => {

  const router = express.Router()

  router.post('/', helper.checkAuth(true), bodyParser, (req, res, next) => {
    store.saveQuiz(req.body &&
        Object.assign(
          helper.clone(req.body),
          {
            created: moment().format('YYYY-MM-DD hh:mm:ss'),
          }
        )
      )
      .then(data => {
        res.status(201).send(data)
      })
      .catch(next)
  })

  router.get('/', (req, res, next) => {
    store.getQuizzes()
      .then(data => {
        res.status(200).send(data)
      })
      .catch(next)
  })

  router.get('/:id', (req, res, next) => {
    const authorized = helper.checkAuth()(req, res)
    store.getQuiz(req.params.id)
      .then(quiz => {
        if (!authorized) {
          quiz.questions.forEach(question => {
            question.choices = question.choices.map(choice => _.omit(choice, 'score'))
          })
        }
        res.send(quiz)
      })
      .catch(next)
  })

  return router
}
