const Promise = require('bluebird')
const express = require('express')
//const Boom = require('boom')
const log = require('hw-logger').log
const Store = require('./services/store')
const config = require('./config')

const quizzy = (store, redisCli) => {
  const router = express.Router()
  router.use('/api', require('./routes/api')(store, redisCli))
  router.get('/', (req, res) => {
    res.render('index', {title: 'Hey', message: 'Hello there!'})
  })
  router.use((req, res, next) => {
    res.render('404')
  })
  return router
}

quizzy.Store = Store

if (module.parent) {
  module.exports = quizzy
} else {
  (function autoStart() {
    const path = require('path')
    const fs = require('fs')
    const logger = require('hw-logger')
    const pkg = require('../package')
    const isDev = process.env.NODE_ENV === 'development'
    const webpack = isDev && require('webpack')
    const webpackDevMiddleware = isDev && require('webpack-dev-middleware')
    const webpackHotMiddleware = isDev && require('webpack-hot-middleware')
    const webpackConfig = isDev && require('../webpack.config')
    const compiler = isDev && webpack(webpackConfig)
    const store = Store.create('redis', {
      redis: {
        rootKey: 'quizzy'
      },
    })
    const viewRenderer = require('./services/view-renderer')
    return store.start()
      .then(() => {
        logger.init()
        const app = express()
        app.locals.store = store
        app.engine('html', viewRenderer())
        app.set('views', path.resolve(__dirname, '../views'))
        app.set('view engine', 'html')
        if (isDev) {
          app.use(webpackDevMiddleware(compiler, {
            publicPath: webpackConfig.output.publicPath,
            stats: {colors: true}
          }))
          app.use(webpackHotMiddleware(compiler, {
            log: log.info
          }))
        }
        app.use('/assets', express.static(path.resolve(__dirname, '../assets')))
        app.use(logger.express())
        app.use(quizzy(store, store.redis.cli))
        const socket = config.get('server.socket')
        if (socket && fs.existsSync(socket)) {
          fs.unlinkSync(socket)
        }
        const listenArgs = [socket || config.get('server.port')]
        const hostname = config.get('server.hostname')
        hostname && !socket && listenArgs.push(hostname)
        const server = app.listen(...listenArgs)
        process.on('message', message => {
          if (message === 'shutdown') {
            return Promise.fromCallback(server.close.bind(server))
              .finally(() => store.stop()
                .finally(() => {
                  log.info(`${pkg.name}/${pkg.version} server stopped`)
                })
              )
          }
        })
        return new Promise(resolve => server.once('listening', () => resolve(server)))
      })
      .then(server => {
        if (process.send) {
          process.send('online')
        }
        const serverAddress = server.address()
        const hostname = typeof serverAddress === 'object' &&
          (serverAddress.address === '::' ? '0.0.0.0' : serverAddress.address)
        const port = typeof serverAddress === 'object' && serverAddress.port
        const listening = typeof serverAddress === 'object' ? `${hostname}:${port}` : serverAddress
        log.info(`${pkg.name}/${pkg.version} server is listening to ${listening}`)
      })
  })()
}
