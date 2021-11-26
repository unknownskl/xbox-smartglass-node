import dgram = require('dgram');

export default class Socket {

    _socket:dgram.Socket

    constructor() {
        this._socket = dgram.createSocket('udp4')
    }

    create() {
        return new Promise((resolve, reject) => {
            this._socket.bind()

            this._socket.on('error', (error) => {
                reject(error)
            })
            this._socket.on('listening', (error) => {
                // this._socket.setBroadcast(true)
                resolve(error)
            })

            this._socket.on('message', this._onMessage)
        })
    }

    _onMessage(message, remote) {
        console.log('Socket message:', message, remote)
    }

    send(message, ip) {
        this._socket.send(message, 0, message.length, 5050, ip, (err, bytes) => {
            console.log('[Socket] Sending packet to client: '+ip+':'+5050)
            console.log(message.toString('hex'))
        })
    }

    close(){
        this._socket?.close()
    }
}