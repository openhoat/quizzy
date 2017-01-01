const bodyParser = require('body-parser')
const yaml = require('js-yaml')
//const log = require('hw-logger').log
const yamlTextBodyParser = bodyParser.text({type: 'application/x-yaml'})
const jsonBodyParser = bodyParser.json()

module.exports = (req, res, next) => {
  if (req.is('application/x-yaml')) {
    return yamlTextBodyParser(req, res, () => {
      req.body = yaml.safeLoad(req.body)
      next()
    })
  } else if (req.is('json')) {
    return jsonBodyParser(req, res, next)
  }
  next()
}
