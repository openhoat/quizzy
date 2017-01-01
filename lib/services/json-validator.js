const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const yaml = require('js-yaml')
const jsonschema = require('jsonschema')
//const log = require('hw-logger').log

class JsonValidatorError extends Error {
}

class JsonTypeError extends JsonValidatorError {
}

class JsonValidationError extends JsonValidatorError {
}

class JsonValidator {

  static toYaml(o) {
    return yaml.safeDump(o)
  }

  static readSchemaFile(file) {
    const fileExt = path.extname(file)
    const data = fs.readFileSync(file, 'utf8')
    if (/(yaml|yml)$/i.test(fileExt)) {
      return yaml.safeLoad(data)
    } else if (/json$/i.test(fileExt)) {
      return JSON.parse(data)
    } else {
      throw new JsonTypeError(`file type "${fileExt}" not supported!`)
    }
  }

  constructor(config) {
    this.config = Object.assign({}, _.pick(config, ['schemas', 'baseDir']))
    this.v = new jsonschema.Validator()
    if (this.config.schemas) {
      this.config.schemas.forEach(schema => this.addSchema(schema))
    } else {
      fs.readdirSync(this.config.baseDir)
        .forEach(filename => {
          this.loadSchemaFile(filename)
        })
    }
  }

  addSchema(schema) {
    this.v.addSchema(Object.assign(
      {
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object'
      },
      schema
    ))
  }

  loadSchemaFile(filename) {
    const file = path.join(this.config.baseDir, filename)
    const stats = fs.statSync(file)
    if (!stats.isFile()) {
      return
    }
    this.addSchema(JsonValidator.readSchemaFile(file))
  }

  validate(data, schemaId) {
    const schema = this.v.getSchema(schemaId)
    const validation = this.v.validate(data || {}, schema)
    if (validation.errors.length) {
      throw new JsonValidationError(validation.errors)
    }
    return true
  }

}

JsonValidator.errors = {JsonValidatorError, JsonTypeError, JsonValidationError}

function JsonValidatorFactory(...args) {
  return new JsonValidator(...args)
}
JsonValidatorFactory.errors = JsonValidator.errors

module.exports = JsonValidatorFactory
