const jwt = require('jsonwebtoken')
const _ = require('lodash')
const Boom = require('boom')
//const log = require('hw-logger').log

class ExtendableError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(message)).stack
    }
  }
}

const helper = {
  ExtendableError,
  clone: o => o && JSON.parse(JSON.stringify(o)),
  getPublicBaseUrl: req => {
    const protocol = req.get('X-Forwarded-Proto') || req.protocol
    const host = req.get('X-Forwarded-Host') || req.get('host')
    return `${protocol}://${host}`
  },
  getJwtSecret: config => config.get('jwt.secret'),
  getJwtOpt: config => (opt => opt && JSON.parse(opt))(config.jwt.opt),
  checkJwt: (config, token) => jwt.verify(token, helper.getJwtSecret(config)),
  createJwt: (config, data) => {
    const opt = _.pick(data, [
      'algorithm', 'expiresIn', 'notBefore', 'audience',
      'issuer', 'jwtid', 'subject', 'noTimestamp', 'header'
    ])
    data = _.omit(data, Object.keys(opt))
    const secret = helper.getJwtSecret(config)
    const options = Object.assign({}, helper.getJwtOpt(config), opt)
    return jwt.sign(data, secret, options)
  },
  checkAuth: (config, needAdmin) => (req, res, next) => {
    try {
      const user = (() => {
        const match = req.headers.authorization && req.headers.authorization.match(/^([\S]+) ([\S]+)$/)
        const authType = match && match[1]
        const token = match && match[2]
        if (!token) {
          throw Boom.unauthorized()
        }
        if (authType === 'JWT') {
          return helper.checkJwt(config, token)
        }
        if (authType === 'KEY') {
          const ok = token === (process.env.ACCESS_TOKEN || 'O_TdAdGuDO_XRrYG0goExnMP')
          if (!ok) {
            throw Boom.unauthorized()
          }
          return ok
        }
        throw Boom.unauthorized()
      })()
      res.locals.user = _.pick(user, ['provider', 'name', 'email'])
      const isAdmin = (config.admin || []).indexOf(user.email) !== -1
      res.locals.isAdmin = isAdmin
      if (needAdmin && !isAdmin) {
        throw Boom.forbidden()
      }
      return next ? next() : user
    } catch (err) {
      if (next) {
        return next(err)
      }
      return false
    }
  },
}

module.exports = helper
