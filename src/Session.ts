
import Smartglass from './Smartglass'
import UdpSocket from './UdpSocket'
import Events from './Events'

export default class Session {
    _client:Smartglass;
    _socket:UdpSocket;
    _events:Events;
  
    constructor(client:Smartglass){
        this._client = client
        this._socket = new UdpSocket(this)
        this._events = new Events()
    }

    create() {
        return new Promise((resolve, reject) => {
            this._socket.create().then(() => {
                resolve(true)

            }).catch((error) => {
                reject(error)
            })
        })
    }

    send(data, ip) {
        return this._socket.send(data, ip)
    }

    close() {
        return this._socket.close()
    }

    on(name, callback){
        this._events.on(name, callback)
    }

    emit(name, data){
        this._events.emit(name, data)
    }
}