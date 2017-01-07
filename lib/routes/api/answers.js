const Promise = require('bluebird')
const express = require('express')
const _ = require('lodash')
const bodyParser = require('../../services/body-parser')
const helper = require('../../helper')
const logger = require('hw-logger')
const log = logger.log

module.exports = (config, store) => {

  const router = express.Router()

  router.post('/', helper.checkAuth(config), bodyParser, (req, res, next) => Promise.resolve()
    .then(() => helper.postAnswers(_.get(res, 'locals.user'), req.body, store))
    .then(session => {
      if (res.locals.isAdmin) {
        return session
      }
      return helper.postSessionHook(config, session)
        .catch(err => {
          logger.enabledLevels.warn && log.warn('hook error :', err)
        })
        .then(session => helper.sendSessionEmail(config, session))
        .return(session)
    })
    .then(data => {
      res.status(201).renderData(data)
    })
    .catch(next)
  )

  return router
}
