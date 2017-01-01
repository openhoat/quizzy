const Promise = require('bluebird')
const _ = require('lodash')
const redis = require('redis')
const logger = require('hw-logger')
const log = logger.log

Promise.promisifyAll(redis.RedisClient.prototype)

class RedisCli {

  constructor(config) {
    this.config = ({
      host: 'localhost',
      port: 6379,
      auth_pass: process.env.QUIZ_API_REDIS_PASSWORD,
      no_ready_check: true,
      init() {
        return _.chain(this).assign(config).omit(_.isUndefined).omit(_.isNull).value()
      }
    }).init()
  }

  start() {
    return new Promise(
      (resolve, reject) => {
        this.cli = redis.createClient(this.config)
        const errorHandler = err => {
          this.cli = null
          reject(err)
        }
        this.cli.once('error', errorHandler)
        this.cli.once('connect', () => {
          this.cli.removeListener('error', errorHandler)
          resolve()
        })
      })
  }

  stop() {
    if (!this.cli) {
      return Promise.resolve(false)
    }
    return this.cli.quitAsync()
      .then(() => new Promise(resolve => {
        this.cli.once('end', () => {
          resolve()
        })
      }))
  }

  exec(op, ...args) {
    return Promise.resolve()
      .then(() => {
        if (!op) {
          throw new Error('missing op!')
        }
        if (typeof this.cli[`${op}Async`] !== 'function') {
          throw new Error(`unsupported op : ${op}`)
        }
        logger.enabledLevels.debug && log.debug(`redis exec : ${op}(%s)`, ...args)
        return this.cli[`${op}Async`](...args)
      })
  }

  execOnce(...args) {
    return this.start()
      .then(() => this.exec(...args))
      .finally(() => this.stop())
  }
}

function RedisCliFactory(...args) {
  return new RedisCli(...args)
}

module.exports = RedisCliFactory
