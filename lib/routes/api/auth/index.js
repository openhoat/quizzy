const express = require('express')
const passport = require('passport')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
//const log = require('hw-logger').log

module.exports = (config, store) => {
  const router = express.Router()
  const sessionStore = store.name === 'redis' && new RedisStore({client: store.redis.cli})

  passport.serializeUser((user, done) => store
    .saveUser(user)
    .return(user.email)
    .asCallback(done)
  )

  passport.deserializeUser((email, done) => store
    .getUser(email)
    .asCallback(done)
  )

  router.use(session({
    secret: config.get('express.session.secret'),
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false},
    store: sessionStore,
  }))

  router.use(passport.initialize())
  router.use(passport.session())
  router.use('/google', require('./google')(config, passport))
  router.use('/facebook', require('./facebook')(config, passport))
  router.use('/twitter', require('./twitter')(config, passport))

  return router
}
