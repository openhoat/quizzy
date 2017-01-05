const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const template = require('lodash.template')
//const log = require('hw-logger').log
Promise.promisifyAll(fs)

const cache = {}

const renderer = tplOpt => {
  const render = function(filePath, options, callback) {
    options = Object.assign({}, tplOpt, options)
    const include = (includePath, opt) => {
      includePath = path.resolve(path.dirname(filePath), `${includePath}${this.ext}`)
      return render(includePath, Object.assign({}, options, opt))
    }
    if (callback) {
      return Promise.resolve()
        .then(() => cache[filePath] ||
          fs.readFileAsync(filePath, 'utf8')
            .then(data => (cache[filePath] = template(data, Object.assign({imports: {include}}, tplOpt))))
        )
        .then(tplFn => tplFn(options))
        .asCallback(callback)
    } else {
      const data = cache[filePath] || (cache[filePath] = fs.readFileSync(filePath, 'utf8'))
      const tplFn = template(data, Object.assign({imports: {include}}, tplOpt))
      return tplFn(options)
    }
  }
  return render
}

module.exports = renderer
