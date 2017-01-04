const express = require('express')
const Promise = require('bluebird')
const TwitterStrategy = require('passport-twitter').Strategy
const Twitter = require('twitter')
const Boom = require('boom')
const logger = require('hw-logger')
const log = logger.log
const helper = require('../../../../helper')
const router = express.Router()

module.exports = (config, passport) => {

  router.get('/', (req, res, next) => passport.authenticate(
    'twitter', {
      callbackURL: `${helper.getPublicBaseUrl(req)}${req.baseUrl}/callback`,
    })(req, res, next)
  )

  router.get('/callback',
    (req, res, next) => passport.authenticate('twitter', {
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

  passport.use(new TwitterStrategy(
    {
      consumerKey: config.get('auth.twitter.consumerKey'),
      consumerSecret: config.get('auth.twitter.consumerSecret'),
    },
    (accessToken, accessTokenSecret, profile, done) => {
      logger.enabledLevels.debug && log.debug('twitter profile :', profile)
      return new Promise(
        (resolve, reject) => {
          const client = new Twitter({
            consumer_key: config.get('auth.twitter.consumerKey'),
            consumer_secret: config.get('auth.twitter.consumerSecret'),
            access_token_key: accessToken,
            access_token_secret: accessTokenSecret,
          })
          client.get('account/verify_credentials', {include_email: true, skip_status: true}, (err, data) => {
            if (err) {
              return reject(err)
            }
            resolve({
              provider: 'twitter',
              name: data.name,
              email: data.email,
            })
          })
        })
        .asCallback(done)
    }
  ))
  return router

}
