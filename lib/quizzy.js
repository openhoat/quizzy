const Promise = require('bluebird')
const path = require('path')
const express = require('express')
const _ = require('lodash')
const fs = require('fs')
const logger = require('hw-logger')
const log = logger.log
const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'
const pkg = require('../package')
const helper = require('./helper')
const Store = require('./services/store')
const viewRenderer = require('./services/view-renderer')
const defaultConfig = require('./config')
Promise.promisifyAll(fs)
let webpack
let webpackDevMiddleware
let webpackHotMiddleware
let webpackConfig
let compiler

if (isDev) {
  try {
    webpack = require('webpack')
    webpackDevMiddleware = require('webpack-dev-middleware')
    webpackHotMiddleware = require('webpack-hot-middleware')
    webpackConfig = require('../webpack.config')
    compiler = webpack(webpackConfig)
  } catch (err) {
    logger.enabledLevels.warn && log.warn(err)
  }
}

class Quizzy {

  constructor(config = defaultConfig) {
    this.config = Object.assign(helper.clone(config), {
      get(key, defaultValue) {
        return _.get(this, key, defaultValue)
      }
    })
  }

  init() {
    const persistenceType = this.config.get('persistence.type', 'memory')
    this.store = Store.create(persistenceType, this.config.get('persistence'))
    this.initialized = true
  }

  start(cb) {
    const socket = this.config.get('server.socket')
    return Promise.resolve()
      .then(() => {
        if (!this.initialized) {
          this.init()
        }
      })
      .then(() => this.store.start())
      .then(() => {
        this.app = express()
        Object.assign(this.app.locals, {isDev, config: this.config, viewRenderer, store: this.store})
        this.app.engine('html', viewRenderer({
          config: this.config,
          bundle: isProd ? 'quizzy-bundle.min.js' : 'quizzy-bundle.js'
        }))
        this.app.set('views', path.resolve(__dirname, '../views'))
        this.app.set('view engine', 'html')
        if (isDev && compiler) {
          this.app.use(webpackDevMiddleware(compiler, {
            publicPath: webpackConfig.output.publicPath,
            stats: {colors: true},
            log: log.debug,
          }))
          this.app.use(webpackHotMiddleware(compiler, {log: log.debug}))
        }
        this.app.use('/assets', express.static(path.resolve(__dirname, '../assets')))
        this.app.use(logger.express())
        this.app.use('/api', require('./routes/api')(this.config, this.store))
        logger.setLevel()
        this.app.get('/', (req, res) => {
          res.render('index')
        })
        this.app.use((req, res) => {
          res.status(404).render('404')
        })
      })
      .then(() => {
        if (!socket) {
          return
        }
        return fs.existsAsync(socket).then(exists => {
          if (exists) {
            return fs.unlinkAsync(socket)
          }
        })
      })
      .then(() => {
        const listenArgs = [socket || this.config.get('server.port')]
        const hostname = this.config.get('server.hostname')
        hostname && !socket && listenArgs.push(hostname)
        this.app.locals.server = this.app.listen(...listenArgs)
        process.once('message', message => {
          if (message === 'shutdown') {
            return this.stop()
          }
        })
        return new Promise(resolve => this.app.locals.server.once('listening', resolve))
      })
      .then(() => {
        if (process.send) {
          process.send('online')
        }
        const serverAddress = this.app.locals.server.address()
        const hostname = typeof serverAddress === 'object' &&
          (serverAddress.address === '::' ? '0.0.0.0' : serverAddress.address)
        const port = typeof serverAddress === 'object' && serverAddress.port
        const listening = typeof serverAddress === 'object' ? `${hostname}:${port}` : serverAddress
        logger.enabledLevels.info && log.info(`${pkg.name}/${pkg.version} server is listening to ${listening}`)
        this.started = true
      })
      .asCallback(cb)
  }

  stop(cb) {
    return Promise.resolve()
      .then(() => {
        if (!this.started) {
          return false
        }
        return Promise.fromCallback(this.app.locals.server.close.bind(this.app.locals.server))
          .then(() => this.store.stop())
          .then(() => {
            logger.enabledLevels.info && log.info(`${pkg.name}/${pkg.version} server stopped`)
            this.started = false
            return true
          })
      })
      .asCallback(cb)
  }

}

function QuizzyFactory(...args) {
  return new Quizzy(...args)
}

if (module.parent) {
  module.exports = QuizzyFactory
} else {
  QuizzyFactory().start()
}
