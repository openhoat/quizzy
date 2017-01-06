const express = require('express')
const _ = require('lodash')
const bodyParser = require('../../services/body-parser')
const helper = require('../../helper')
//const log = require('hw-logger').log

module.exports = (config, store) => {

  const router = express.Router()

  router.post('/', helper.checkAuth(config, true), bodyParser, (req, res, next) => {
    store.saveQuiz(req.body &&
        Object.assign(
          helper.clone(req.body),
          {
            created: new Date(),
          }
        )
      )
      .then(data => {
        res.status(201).renderData(data)
      })
      .catch(next)
  })

  router.get('/', (req, res, next) => {
    store.getQuizzes()
      .then(data => {
        res.renderData(data)
      })
      .catch(next)
  })

  router.get('/:id', (req, res, next) => {
    const authorized = helper.checkAuth(config)(req, res)
    store.getQuiz(req.params.id)
      .then(data => {
        if (!authorized) {
          data.questions.forEach(question => {
            question.choices = question.choices.map(choice => _.omit(choice, 'score'))
          })
        }
        res.renderData(data)
      })
      .catch(next)
  })

  return router
}
