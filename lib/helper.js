const Promise = require('bluebird')
const jwt = require('jsonwebtoken')
const yaml = require('js-yaml')
const _ = require('lodash')
const moment = require('moment')
const Boom = require('boom')
const request = require('request')
const requestAsync = Promise.promisify(request, {multiArgs: true})
const logger = require('hw-logger')
const log = logger.log

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
      logger.enabledLevels.debug && log.debug('authenticated user :', res.locals.user.email)
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
  postAnswers: (user, answers, store) => Promise.resolve()
    .then(() => {
      const now = moment()
      store.validateAnswers(answers)
      return store.getQuiz(answers && answers.quizId)
        .then(quiz => store.findSessions(user.email)
          .then(userSessions => {
            userSessions = Array.isArray(userSessions) ? userSessions : [userSessions]
            if (userSessions.filter(userSession => userSession.quizId === quiz.id).length) {
              throw Boom.conflict()
            }
          })
          .catch(store.errors.NotFoundError, _.noop)
          .return(quiz)
        )
        .then(quiz => {
          const sessionId = `${user.email}:${quiz.id}`
          const maxScore = quiz.questions.reduce((max, question) => {
            const scores = question.choices.map(choice => choice.score || 0)
            return max + Math.max(...scores)
          }, 0)
          const session = (answers && answers.answers || {})
            .reduce((session, answer, index) => {
              const question = quiz.questions[index]
              const choice = question && question.choices[answer.choice - 1]
              const score = choice && choice.score || 0
              const sessionAnswer = {question, choice: answer.choice, score}
              if (typeof answer.duration === 'number') {
                session.duration = session.duration || 0
                session.duration += sessionAnswer.duration = answer.duration
              }
              session.answers.push(sessionAnswer)
              session.score += score
              return session
            }, {
              id: sessionId,
              created: now.format('YYYY-MM-DD hh:mm:ss'),
              user,
              quizId: quiz.id,
              answers: [],
              score: 0,
              max: maxScore,
            })
          const result = quiz.results && _.get(quiz.results,
              _.first(
                Object.keys(quiz.results)
                  .map(key => parseInt(key))
                  .sort((a, b) => b - a)
                  .filter(key => session.score >= key)
              ))
          if (result) {
            session.result = result
          }
          return store.saveSession(session)
        })
    }),
  postSessionHook: (config, session) => Promise.resolve()
    .then(() => {
      const url = config.get('hooks.quizSession.url')
      if (!url) {
        return session
      }
      const reqOpt = {
        method: 'post',
        url,
        json: true,
        body: session,
      }
      const { username, password } = config.get('hooks.quizSession')
      if (username) {
        reqOpt.auth = {
          user: username,
          pass: password,
        }
      }
      return requestAsync(reqOpt)
        .spread((res, body) => {
          logger.enabledLevels.info && log.info('hook status code :', res.statusCode)
          logger.enabledLevels.trace && log.trace('hook body :', body)
        })
    }),
  sendSessionEmail: (config, session) => Promise.resolve()
    .then(() => {
      const emailNotification = config.get('hooks.quizSessionEmailNotification')
      if (!emailNotification || !emailNotification.to) {
        return session
      }
      let nodemailer
      try {
        nodemailer = require('nodemailer')
      } catch (err) {
        logger.enabledLevels.warn && log.warn('send mail error :', err)
        return session
      }
      const mailer = nodemailer.createTransport(emailNotification.transport)
      const mail = {
        from: emailNotification.from,
        to: emailNotification.to,
        subject: 'New quiz session',
        text: yaml.dump(session),
      }
      return Promise.promisify(mailer.sendMail)
        .call(mailer, mail)
        .then(info => {
          logger.enabledLevels.debug && log.debug('notification info :', info)
        })
        .catch(err => {
          logger.enabledLevels.warn && log.warn('notification error :', err)
        })
        .return(session)
    })
}

module.exports = helper
