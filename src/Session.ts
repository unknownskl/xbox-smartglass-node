
import Smartglass from './Smartglass'
import UdpSocket from './UdpSocket'
import Events from './Events'

export default class Session {
    _client:Smartglass;
    _socket:UdpSocket;
    _events:Events;

    _socketTimeout = 0
    _socketTimeoutInterval;
  
    constructor(client:Smartglass){
        this._client = client
        this._socket = new UdpSocket(this)
        this._events = new Events()
    }

    create() {
        return new Promise((resolve, reject) => {
            this._client._logger.log('[Session.js create()] Creating new session')

            this._socket.create().then(() => {
                this._socketTimeout = Date.now()

                this._socketTimeoutInterval = setInterval(() => {
                    const timeoutTime = Date.now() - (1000 * 15)

                    console.log('check timeout:', timeoutTime, '>', this._socketTimeout, '=', (this._socketTimeout - timeoutTime)/1000)

                    if(timeoutTime > this._socketTimeout) {
                        clearInterval(this._socketTimeoutInterval)
                        this.close()
                        console.log('[Session.ts create()] Session timed out after 15 seconds. Closing session')
                    }
                }, 1000)

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