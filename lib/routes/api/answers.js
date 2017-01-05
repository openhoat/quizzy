const Promise = require('bluebird')
const express = require('express')
const _ = require('lodash')
const bodyParser = require('../../services/body-parser')
const moment = require('moment')
const Boom = require('boom')
const yaml = require('js-yaml')
const request = require('request')
const requestAsync = Promise.promisify(request, {multiArgs: true})
const helper = require('../../helper')
const logger = require('hw-logger')
const log = logger.log

module.exports = (config, store) => {

  const router = express.Router()

  router.post('/', helper.checkAuth(config), bodyParser, (req, res, next) => {
    const user = _.get(res, 'locals.user')
    const now = moment()
    store.getQuiz(req.body && req.body.quizId)
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
        const session = (req.body && req.body.answers || {})
          .reduce((session, answer, index) => {
            const question = quiz.questions[index]
            const choice = question && question.choices[answer - 1]
            const score = choice && choice.score || 0
            session.score += score
            session.answers.push({question, choice: answer, score})
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
      .then(session => {
        const url = config.get('hooks.quizSession.url')
        if (!url) {
          return session
        }
        const reqOpt = {
          method: 'post',
          url,
          json: true,
          body: Object.assign({'@timestamp': now.format()}, session)
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
          .catch(err => {
            logger.enabledLevels.warn && log.warn('hook error :', err)
          })
          .return(session)
      })
      .then(session => {
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
      .then(data => {
        res.status(201).renderData(data)
      })
      .catch(next)
  })

  return router
}
