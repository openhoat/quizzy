const express = require('express')
const Promise = require('bluebird')
const FacebookStrategy = require('passport-facebook').Strategy
const FB = require('fb')
const Boom = require('boom')
const logger = require('hw-logger')
const log = logger.log
const helper = require('../../../../helper')
const router = express.Router()

module.exports = (config, passport) => {

  router.get('/', (req, res, next) => passport.authenticate(
    'facebook', {
      scope: 'email',
      callbackURL: `${helper.getPublicBaseUrl(req)}${req.baseUrl}/callback`,
    })(req, res, next)
  )

  router.get('/callback',
    (req, res, next) => passport.authenticate('facebook', {
      failureRedirect: `${req.baseUrl}/fail`,
      callbackURL: `${helper.getPublicBaseUrl(req)}${req.baseUrl}/callback`,
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

  passport.use(new FacebookStrategy(
    {
      clientID: config.get('auth.facebook.clientId'),
      clientSecret: config.get('auth.facebook.clientSecret'),
    },
    (accessToken, refreshToken, profile, done) => {
      logger.enabledLevels.debug && log.debug('facebook profile :', profile)
      return new Promise(
        (resolve, reject) => {
          FB.setAccessToken(accessToken)
          FB.api('/me', {fields: 'id,name,email'}, res => {
            if (res.error) {
              return reject(res.error)
            }
            resolve({
              provider: 'facebook',
              name: res.name,
              email: res.email,
            })
          })
        })
        .asCallback(done)
    }
  ))
  return router

}
