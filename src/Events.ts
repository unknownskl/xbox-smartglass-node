import EventEmitter from 'events'

export default class Events {
    _eventEmitter:EventEmitter;
  
    constructor(){
        this._eventEmitter = new EventEmitter()
    }

    on(name, callback){
        this._eventEmitter.on(name, callback)
    }

    once(name, callback){
        this._eventEmitter.once(name, callback)
    }

    emit(name, data){
        this._eventEmitter.emit(name, data)
    }
}