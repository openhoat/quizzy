const chai = require('chai')
const _ = require('lodash')
const tmp = require('tmp')
const request = require('request')
const Promise = require('bluebird')
//const logger = require('hw-logger')
//const log = logger.log
const helper = require('../lib/helper')
const expect = chai.expect
const Quizzy = require('../lib/quizzy')

const quizzes = [
  {
    id: 'president',
    title: 'President Quiz',
    description: 'Questions about presidents of the USA',
    questions: [{
      title: 'Who was the only President to serve more than two terms?',
      choices: [{
        value: 'Franklin D. Roosevelt',
        score: 50,
      }, {
        value: 'Theodore Roosevelt'
      }, {
        value: 'Ulysses S. Grant'
      }, {
        value: 'George Washington'
      }]
    }, {
      title: 'Who was the only President to serve two non-consecutive terms?',
      choices: [{
        value: 'Ronald Reagan',
      }, {
        value: 'Woodrow Wilson',
      }, {
        value: 'Theodore Roosevelt',
      }, {
        value: 'Grover Cleveland',
        score: 50,
      }]
    }],
    results: {
      100: 'You are a god!',
      50: 'Not so bad',
      0: 'You are too bad',
    }
  },
  {
    id: 'anotherpresident',
    title: 'Another president Quiz',
    description: 'More questions about presidents of the USA',
    questions: [{
      title: 'Who was the oldest elected President?',
      choices: [{
        value: 'James Buchanan',
      }, {
        value: 'Dwight D. Eisenhower',
      }, {
        value: 'Ronald Reagan',
        score: 50,
      }, {
        value: 'Zachary Taylor',
      }]
    }, {
      title: 'Who was the first President to live in the White House?',
      choices: [{
        value: 'Thomas Jefferson',
      }, {
        value: 'George Washington',
      }, {
        value: 'Andrew Jackson',
      }, {
        value: 'John Adams',
        score: 50,
      }]
    }],
    results: {
      100: 'You are a god!',
      50: 'Not so bad',
      0: 'You are too bad',
    }
  }
]
const goodSession = {quizId: 'president', answers: [1, 4]}
const badSession = {quizId: 'anotherpresident', answers: [2, 1]}
const player = {
  provider: 'google',
  name: 'John Doe',
  email: 'john.doe@gmail.com'
}
const admin = {
  provider: 'google',
  name: 'Administrator',
  email: 'admin@quizzy.io'
}

describe('quizzy routes', function() {

  this.timeout(30000)

  const config = require('../lib/config')
  const playerJwtToken = helper.createJwt(config, player)
  const playerAuthorization = `JWT ${playerJwtToken}`
  const adminJwtToken = helper.createJwt(config, admin)
  const adminAuthorization = `JWT ${adminJwtToken}`;

  ['memory', 'redis'].forEach(persistenceType => {

    describe(`${persistenceType} store`, () => {

      let quizzy
      let requestAsync

      before(() => Promise.resolve()
        .then(() => {
          _.set(config, 'persistence.type', persistenceType)
          const socket = tmp.tmpNameSync({prefix: 'test-', postfix: '.sock'})
          _.set(config, 'server.socket', socket)
          quizzy = Quizzy(config)
          requestAsync = Promise.promisify(request.defaults({
            baseUrl: `http://unix:/${socket}:/`
          }), {multiArgs: true})
        })
        .then(() => {
          quizzy.init()
          return quizzy.start()
        })
      )

      after(() => quizzy.store.deleteAll()
        .finally(() => quizzy.stop())
      )

      describe('api', () => {

        it('should return an error when getting a bad uri', () => requestAsync(
          {
            method: 'get',
            url: `/api/baduri`,
            json: true,
          })
          .spread((res, body) => {
            expect(res).to.have.property('statusCode', 404)
            expect(body).to.eql({code: 'Not Found'})
          })
        )

        it('should return an error when posting incomplete quiz', () => requestAsync(
          {
            method: 'post',
            url: '/api/quizzes',
            headers: {authorization: adminAuthorization},
            json: true,
          })
          .spread((res, body) => {
            expect(res).to.have.property('statusCode', 400)
            expect(body).to.eql({
              code: 'Bad Request',
              message: [
                'instance requires property "id"',
                'instance requires property "created"',
                'instance requires property "title"',
                'instance requires property "questions"',
                'instance requires property "results"',
              ].join(',')
            })
          })
        )

        it('should return a forbidden error when trying to post quiz with insufficient authorization', () => {
          const req = {
            method: 'post',
            url: '/api/quizzes',
            body: quizzes[0],
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 403)
              expect(body).to.eql({code: 'Forbidden'})
            })
        })

        it('should post president quiz', () => {
          const req = {
            method: 'post',
            url: '/api/quizzes',
            body: quizzes[0],
            headers: {authorization: adminAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 201)
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(_.omit(body, 'created')).to.eql(quizzes[0])
            })
        })

        it('should post another president quiz', () => {
          const req = {
            method: 'post',
            url: '/api/quizzes',
            body: quizzes[1],
            headers: {authorization: adminAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 201)
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(_.omit(body, 'created')).to.eql(quizzes[1])
            })
        })

        it('should get quizzes', () => {
          const req = {
            method: 'get',
            url: `/api/quizzes`,
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              const expected = [{
                id: 'president',
                description: 'Questions about presidents of the USA',
                title: 'President Quiz',
              }, {
                id: 'anotherpresident',
                description: 'More questions about presidents of the USA',
                title: 'Another president Quiz',
              }]
              expected.forEach(quiz => {
                expect(body).to.include(quiz)
              })
              body.forEach(quiz => {
                expect(expected).to.include(quiz)
              })
            })
        })

        it('should return an error when getting a bad quiz id', () => requestAsync(
          {
            method: 'get',
            url: `/api/quizzes/badid`,
            headers: {authorization: playerAuthorization},
            json: true,
          })
          .spread((res, body) => {
            expect(res).to.have.property('statusCode', 404)
            expect(body).to.eql({code: 'Not Found', message: 'Not found'})
          })
        )

        it('should get quiz', () => {
          const req = {
            method: 'get',
            url: `/api/quizzes/${quizzes[0].id}`,
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.have.property('created')
              expect(_.omit(body, 'created')).to.eql(quizzes[0])
            })
        })

        it('should get quiz without authorization', () => {
          const req = {
            method: 'get',
            url: `/api/quizzes/${quizzes[0].id}`,
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.have.property('created')
              const expected = helper.clone(quizzes[0])
              expected.questions.forEach(question => {
                question.choices = question.choices.map(choice => _.omit(choice, 'score'))
              })
              expect(_.omit(body, 'created')).to.eql(expected)
            })
        })

        it('should return an error when posting session without authorization', () => {
          const req = {
            method: 'post',
            url: '/api/sessions',
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 401)
              expect(body).to.eql({code: 'Unauthorized'})
            })
        })

        it('should return an error when posting incomplete session', () => {
          const req = {
            method: 'post',
            url: '/api/sessions',
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 404)
              expect(body).to.eql({code: 'Not Found', message: 'Not found'})
            })
        })

        it('should post a good session', () => {
          const req = {
            method: 'post',
            url: '/api/sessions',
            headers: {authorization: playerAuthorization},
            body: goodSession,
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 201)
              expect(body).to.have.property('id').that.is.a('string')
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(body).to.have.property('answers')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
              expect(body).to.have.property('quizId', quizzes[0].id)
              expect(body).to.have.property('user')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
              expect(body).to.have.property('score', 100)
              expect(body).to.have.property('result', 'You are a god!')
            })
        })

        it('should post a bad session', () => {
          const req = {
            method: 'post',
            url: `/api/sessions`,
            headers: {authorization: playerAuthorization},
            body: badSession,
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 201)
              expect(body).to.have.property('id').that.is.a('string')
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(body).to.have.property('answers')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
              expect(body).to.have.property('quizId', quizzes[1].id)
              expect(body).to.have.property('user')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
              expect(body).to.have.property('score', 0)
              expect(body).to.have.property('result', 'You are too bad')
            })
        })

        it('should get the good session', () => {
          const req = {
            method: 'get',
            url: `/api/sessions/${goodSession.quizId}`,
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.have.property('id')
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(body).to.have.property('answers')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
              expect(body).to.have.property('quizId', quizzes[0].id)
              expect(body).to.have.property('user')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
              expect(body.user).to.eql(player)
              expect(body).to.have.property('score', 100)
              expect(body).to.have.property('result', 'You are a god!')
            })
        })

        it('should get the bad session', () => {
          const req = {
            method: 'get',
            url: `/api/sessions/${badSession.quizId}`,
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.have.property('id')
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(body).to.have.property('answers')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
              expect(body).to.have.property('quizId', quizzes[1].id)
              expect(body).to.have.property('user')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
              expect(body.user).to.eql(player)
              expect(body).to.have.property('score', 0)
              expect(body).to.have.property('result', 'You are too bad')
            })
        })

        it('should return an error when trying to find player sessions without authorization', () => {
          const req = {
            method: 'get',
            url: '/api/sessions',
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 401)
              expect(body).to.eql({code: 'Unauthorized'})
            })
        })

        it('should get player sessions', () => {
          const req = {
            method: 'get',
            url: '/api/sessions',
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.be.an('array')
              body.forEach(session => {
                expect(session).to.have.property('id').that.contains(player.email)
                expect(session).to.have.property('created')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
                expect(session).to.have.property('answers')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
                expect(session).to.have.property('quizId')
                expect(session).to.have.property('user')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
                expect(session.user).to.eql(player)
                expect(session).to.have.property('score').that.is.a('number')
                expect(session).to.have.property('result').that.is.a('string')
              })
            })
        })

        it('should get player sessions as admin', () => {
          const req = {
            method: 'get',
            url: '/api/sessions',
            query: {email: player.email},
            headers: {authorization: adminAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.be.an('array')
              body.forEach(session => {
                expect(session).to.have.property('id').that.contains(player.email)
                expect(session).to.have.property('created')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
                expect(session).to.have.property('answers')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
                expect(session).to.have.property('quizId')
                expect(session).to.have.property('user')
                  .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
                expect(session.user).to.eql(player)
                expect(session).to.have.property('score').that.is.a('number')
                expect(session).to.have.property('result').that.is.a('string')
              })
            })
        })

        it('should get player good session as admin', () => {
          const req = {
            method: 'get',
            url: `/api/sessions/${goodSession.quizId}`,
            headers: {authorization: adminAuthorization},
            qs: {email: player.email},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.have.property('id')
              expect(body).to.have.property('created')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/DateTime').pattern))
              expect(body).to.have.property('answers')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/Answers').pattern))
              expect(body).to.have.property('quizId', quizzes[0].id)
              expect(body).to.have.property('user')
                .that.matches(new RegExp(quizzy.store.jsonValidator.v.getSchema('/User').pattern))
              expect(body.user).to.eql(player)
              expect(body).to.have.property('score', 100)
              expect(body).to.have.property('result', 'You are a god!')
            })
        })

        it('should return an error when trying to delete good session without admin authorization', () => {
          const req = {
            method: 'delete',
            url: `/api/sessions/${goodSession.quizId}`,
            headers: {authorization: playerAuthorization},
            qs: {email: player.email},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 403)
              expect(body).to.eql({code: 'Forbidden'})
            })
        })

        it('should delete good session', () => {
          const req = {
            method: 'delete',
            url: `/api/sessions/${goodSession.quizId}`,
            headers: {authorization: adminAuthorization},
            qs: {email: player.email},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 204)
              expect(body).to.not.be.ok
            })
        })

        it('should not found good session', () => {
          const req = {
            method: 'get',
            url: `/api/sessions/${goodSession.quizId}`,
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 404)
              expect(body).to.eql({code: 'Not Found', message: 'Not found'})
            })
        })

        it('should delete bad session', () => {
          const req = {
            method: 'delete',
            url: `/api/sessions/${badSession.quizId}`,
            headers: {authorization: adminAuthorization},
            qs: {email: player.email},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 204)
              expect(body).to.not.be.ok
            })
        })

        it('should not found bad session', () => {
          const req = {
            method: 'get',
            url: `/api/sessions/${badSession.quizId}`,
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 404)
              expect(body).to.eql({code: 'Not Found', message: 'Not found'})
            })
        })

        it('should get empty player sessions', () => {
          const req = {
            method: 'get',
            url: '/api/sessions',
            headers: {authorization: playerAuthorization},
            json: true,
          }
          return requestAsync(req)
            .spread((res, body) => {
              expect(res).to.have.property('statusCode', 200)
              expect(body).to.be.an('array').that.is.empty
            })
        })

      })

    })

  })

})
