const express = require('express')
const passport = require('passport')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const config = require('../../../config')

module.exports = (store, redisCli) => {
  const router = express.Router()

  passport.serializeUser((user, done) => store
    .saveUser(user)
    .return(user.id)
    .asCallback(done)
  )

  passport.deserializeUser((id, done) => store
    .getUser(id)
    .asCallback(done)
  )

  router.use(session({
    secret: config.get('express.sessionSecret'),
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false},
    store: new RedisStore({client: redisCli}),
  }))

  router.use(passport.initialize())
  router.use(passport.session())
  router.use('/google', require('./google')(passport))
  router.use('/facebook', require('./facebook')(passport))
  router.use('/twitter', require('./twitter')(passport))

  return router
}
