import dgram = require('dgram')
import Session from './lib/Session'

export default class Socket {

    _socket:dgram.Socket
    _session:Session

    constructor(session:Session) {
        this._socket = dgram.createSocket('udp4')
        this._session = session

        // this._session._client._logger.log('[UdpSocket.js constructor()] Creating new socket')
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

            this._socket.on('message', (message, remote) => this._onMessage(message, remote))
        })
    }

    _onMessage(message, remote) {
        // console.log('Socket message:', message, remote)
        this._session._client._logger.log('[UdpSocket.js _onMessage()] Received message:', message, 'from', remote.address)

        this._session.emit('_on_packet', {
            data: message,
            remote: remote,
        })
    }

    send(message, ip) {
        this._socket.send(message, 0, message.length, 5050, ip, (err, bytes) => {
            // console.log('[Socket] Sending packet to client: '+ip+':'+5050)
            // console.log(message.toString('hex'))
            // this._session._client._logger.log('[UdpSocket.js send()] Send message:', message, 'to', ip)
        })
    }

    close(){
        this._socket?.close()
    }
}