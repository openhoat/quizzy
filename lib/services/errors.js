class NotYetImplementedError extends Error {
  constructor() {
    super()
    this.statusCode = 500
  }
}

const errors = {NotYetImplementedError}

module.exports = errors
