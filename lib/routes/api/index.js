const express = require('express')
const _ = require('lodash')
const Boom = require('boom')
const jwt = require('jsonwebtoken')
const yaml = require('js-yaml')
const logger = require('hw-logger')
const log = logger.log
const JsonValidator = require('../../services/json-validator')
const Store = require('../../services/store')
const yamlType = 'application/x-yaml'

module.exports = store => {
  const router = express.Router()

  router.use((req, res, next) => {
    if (!res.renderData) {
      res.renderData = data => res.format({
        json: () => {
          res.json(data)
        },
        [yamlType]: () => res.send(yaml.safeDump(data)),
      })
    }
    next()
  })
  router.use('/auth', require('./auth')(store))
  router.use('/quizzes', require('./quizzes')(store))
  router.use('/sessions', require('./sessions')(store))

  router.use((req, res) => {
    throw Boom.notFound()
  })

  router.use((err, req, res, next) => {
    if (err instanceof JsonValidator.errors.JsonValidatorError) {
      Boom.wrap(err, 400)
    } else if (err instanceof Store.errors.NotFoundError) {
      Boom.wrap(err, 404)
    } else if (err instanceof jwt.JsonWebTokenError) {
      Boom.wrap(err, 401)
    }
    logger.enabledLevels.debug && log.debug('err :', err)
    const statusCode = _.get(err, 'output.statusCode', 500)
    const data = {
      code: _.get(err, 'output.payload.error', err.code),
      message: _.get(err, 'output.payload.message', err.toString),
    }
    res.status(statusCode).json(data)
  })

  return router
}
