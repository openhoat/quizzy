const express = require('express')
const bodyParser = require('../../services/body-parser')
const helper = require('../../helper')
//const logger = require('hw-logger')
//const log = logger.log

module.exports = (config, store) => {

  const router = express.Router()

  router.post('/', helper.checkAuth(config, true), bodyParser, (req, res, next) => store.saveSession(req.body)
    .then(data => {
      res.status(201).renderData(data)
    })
    .catch(next)
  )

  router.get('/', helper.checkAuth(config), (req, res, next) => {
    const email = res.locals.isAdmin && req.query.email || res.locals.user.email
    store.findSessions(email)
      .then(data => {
        res.renderData(data)
      })
      .catch(next)
  })

  router.get('/:quizId', helper.checkAuth(config), (req, res, next) => {
    const email = res.locals.isAdmin && req.query.email || res.locals.user.email
    store.findSessions(email, req.params.quizId)
      .then(data => {
        res.renderData(data)
      })
      .catch(next)
  })

  router.delete('/:quizId', helper.checkAuth(config, true), (req, res, next) => {
    const email = res.locals.isAdmin && req.query.email || res.locals.user.email
    store.deleteSession(email, req.params.quizId)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

  return router
}
