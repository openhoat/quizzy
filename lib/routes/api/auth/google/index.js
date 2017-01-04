const express = require('express')
const _ = require('lodash')
const Promise = require('bluebird')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const Boom = require('boom')
const logger = require('hw-logger')
const log = logger.log
const helper = require('../../../../helper')
const router = express.Router()

module.exports = (config, passport) => {

  router.get('/', (req, res, next) => passport.authenticate(
    'google', {
      scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/plus.profile.emails.read'
      ],
      callbackURL: `${helper.getPublicBaseUrl(req)}${req.baseUrl}/callback`,
      session: false,
    })(req, res, next)
  )

  router.get('/callback',
    (req, res, next) => passport.authenticate('google', {
      failureRedirect: `${req.baseUrl}/fail`,
      callbackURL: `${helper.getPublicBaseUrl(req)}${req.baseUrl}/callback`,
      session: false,
    })(req, res, next),
    (req, res) => {
      const token = helper.createJwt(config, req.user)
      res.cookie('quizzy-user', JSON.stringify(req.user), {maxAge: config.cookiesMaxAge})
      res.cookie('quizzy-token', token, {maxAge: config.cookiesMaxAge})
      res.redirect('/')
    }
  )

  router.get('/fail', (req, res) => {
    Boom.forbidden('Login failed')
  })

  passport.use(new GoogleStrategy(
    {
      clientID: config.get('auth.google.clientId'),
      clientSecret: config.get('auth.google.clientSecret'),
    },
    (accessToken, refreshToken, profile, done) => {
      logger.enabledLevels.debug && log.debug('google profile :', profile)
      return Promise.resolve()
        .then(() => ({
          provider: 'google',
          name: profile.displayName,
          email: _.first(_.filter(profile.emails, {type: 'account'})).value
        }))
        .asCallback(done)
    }
  ))
  return router

}
