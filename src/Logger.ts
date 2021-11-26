import Debug from 'debug'

export default class Logger {
  _logger:Debug;

  constructor(name:string){
      this._logger = new Debug(name)
  }

  log(...args) {
      return this._logger(...args)
  }

  debug(...args) {
      return this._logger(...args)
  }

  info(...args) {
      return this._logger(...args)
  }

  warning(...args) {
      return this._logger(...args)
  }

  error(...args) {
      return this._logger(...args)
  }

  extend(name) {
      return new Logger(name)
  }
}