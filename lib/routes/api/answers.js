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
    .then(session => helper.postSessionHook(config, session)
      .catch(err => {
        logger.enabledLevels.warn && log.warn('hook error :', err)
      })
      .return(session)
    )
    .then(session => helper.sendSessionEmail(config, session))
    .then(data => {
      res.status(201).renderData(data)
    })
    .catch(next)
  )

  return router
}
