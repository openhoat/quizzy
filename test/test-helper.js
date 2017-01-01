const Promise = require('bluebird')
const httpMocks = require('node-mocks-http')
const _ = require('lodash')
const events = require('events')
//const logger = require('hw-logger')
//const log = logger.log
const helper = require('../lib/helper')

const testHelper = {
  request: (reqOpt, middleware) => new Promise((resolve, reject) => {
    reqOpt = helper.clone(reqOpt)
    if (reqOpt.yaml) {
      _.set(reqOpt, "headers['Content-Type']", 'application/x-yaml')
      _.set(reqOpt, "headers['Accept']", 'application/x-yaml')
    } else if (reqOpt.json) {
      _.set(reqOpt, "headers['Content-Type']", 'application/json')
      _.set(reqOpt, "headers['Accept']", 'application/json')
    }
    const req = httpMocks.createRequest(reqOpt)
    const res = httpMocks.createResponse({eventEmitter: events.EventEmitter})
    res.locals = {}
    res.on('end', () => {
      let body
      try {
        body = JSON.parse(res._getData())
      } catch (err) {
        body = res._getData()
      }
      resolve([body, res])
    })
    try {
      middleware(req, res, reject)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = testHelper
