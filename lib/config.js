const path = require('path')
const requireDirectory = require('require-directory')
const fs = require('fs')
const yaml = require('js-yaml')
const _ = require('lodash')
const vm = require('vm')
const logger = require('hw-logger')
const log = logger.log
const Module = module.constructor
const configBaseDir = path.resolve(__dirname, './config')

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }
  return content
}

Module._extensions['.yaml'] = Module._extensions['.yml'] = (module, filename) => {
  const yamlContent = fs.readFileSync(filename, 'utf8')
  const compiledYamlContent = stripBOM(yamlContent)
  const jsonData = yaml.safeLoad(compiledYamlContent)
  try {
    module.exports = jsonData
  } catch (err) {
    err.message = filename + ': ' + err.message
    throw err
  }
}

function requireNoFail(file) {
  try {
    return require(file)
  } catch (err) {
    return undefined
  }
}

function loadConfig(baseDir) {
  return Object.assign(
    requireNoFail(path.resolve(baseDir, 'index')),
    requireDirectory(module, baseDir, {
      extensions: ['yml', 'yaml', 'json', 'js'],
      exclude: new RegExp(path.resolve(baseDir, `index.(yml|yaml||jsonjs)$`)),
    }),
    {
      get(key, defaultValue) {
        return _.get(this, key, defaultValue)
      }
    }
  )
}

function applyEnv(config) {
  return _.mapValues(config, data => {
    if (typeof data === 'object') {
      return applyEnv(data)
    } else if (typeof data === 'string') {
      try {
        const script = new vm.Script('value = `' + data + '`')
        const value = script.runInNewContext({env: process.env})
        if (value === 'undefined') {
          return undefined
        }
        if (value === 'null') {
          return null
        }
        return value
      } catch (err) {
        console.warn(err)
        return data
      }
    } else {
      return data
    }
  })
}

function applyTo(o, ...fns) {
  return fns.reduce((o, fn) => fn && fn(o) || o, o)
}

const config = applyTo({},
  loadConfig.bind(null, configBaseDir),
  applyEnv
)

logger.enabledLevels.trace && log.trace('config :', JSON.stringify(config, null, 2))

module.exports = config
