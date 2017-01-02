const Promise = require('bluebird')
const path = require('path')
const express = require('express')
const logger = require('hw-logger')
const log = logger.log
const isDev = process.env.NODE_ENV === 'development'
const webpack = isDev && require('webpack')
const webpackDevMiddleware = isDev && require('webpack-dev-middleware')
const webpackHotMiddleware = isDev && require('webpack-hot-middleware')
const webpackConfig = isDev && require('../webpack.config')
const compiler = isDev && webpack(webpackConfig)
const viewRenderer = require('./services/view-renderer')
const config = require('./config')

const quizzy = store => {
  const app = express()

  Object.assign(app.locals, {isDev, config, viewRenderer, store})

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
  app.use('/api', require('./routes/api')(store))

  app.get('/', (req, res) => {
    res.render('index')
  })
  app.use((req, res) => {
    res.render('404')
  })
  return app
}

module.exports = quizzy

if (!module.parent) {
  (function autoStart() {
    const fs = require('fs')
    const pkg = require('../package')
    const Store = require('./services/store')
    const persistenceType = config.get('persistence.type', 'memory')
    const store = Store.create(persistenceType, config.get('persistence'))
    return store.start()
      .then(() => {
        logger.init()
        const app = quizzy(store)
        const socket = config.get('server.socket')
        if (socket && fs.existsSync(socket)) {
          fs.unlinkSync(socket)
        }
        const listenArgs = [socket || config.get('server.port')]
        const hostname = config.get('server.hostname')
        hostname && !socket && listenArgs.push(hostname)
        app.locals.server = app.listen(...listenArgs)
        process.on('message', message => {
          if (message === 'shutdown') {
            return Promise.fromCallback(app.locals.server.close.bind(app.locals.server))
              .finally(() => store.stop()
                .finally(() => {
                  log.info(`${pkg.name}/${pkg.version} server stopped`)
                })
              )
          }
        })
        return new Promise(resolve => app.locals.server.once('listening', () => resolve(app)))
      })
      .then(app => {
        if (process.send) {
          process.send('online')
        }
        const serverAddress = app.locals.server.address()
        const hostname = typeof serverAddress === 'object' &&
          (serverAddress.address === '::' ? '0.0.0.0' : serverAddress.address)
        const port = typeof serverAddress === 'object' && serverAddress.port
        const listening = typeof serverAddress === 'object' ? `${hostname}:${port}` : serverAddress
        log.info(`${pkg.name}/${pkg.version} server is listening to ${listening}`)
      })
  })()
}
