const Promise = require('bluebird')
const chai = require('chai')
const expect = chai.expect
const express = require('express')
const request = require('request')
const tmp = require('tmp')
const log = require('hw-logger').log

class TestServer {

  constructor(middlewares) {
    this.app = express()
    expect(middlewares).to.be.ok
    this.middlewares = Array.isArray(middlewares) ? middlewares : [middlewares]
    this.middlewares.forEach(middleware => {
      this.app.use(middleware)
    })
    this.socket = tmp.tmpNameSync({prefix: 'test-server-', postfix: '.sock'})
    this.request = Promise.promisify(request.defaults({
      baseUrl: `http://unix:/${this.socket}:/`
    }), {multiArgs: true})
  }

  start() {
    return new Promise(
      resolve => {
        this.server = this.app.listen(this.socket, resolve)
      })
      .then(() => {
        log.warn('test server is listening to %s', this.server.address())
      })
  }

  stop() {
    return Promise.resolve()
      .then(() => {
        if (!this.server) {
          return false
        }
        return new Promise(resolve => this.server.close(resolve))
      })
      .then(() => {
        log.warn('test server is closed')
      })
  }

}

module.exports = opt => new TestServer(opt)
