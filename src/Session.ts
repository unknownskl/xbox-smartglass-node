import jsrsasign from 'jsrsasign'
import uuidParse from 'uuid-parse'
import { v4 as uuidv4 } from 'uuid'

import Smartglass from './Smartglass'
import UdpSocket from './UdpSocket'
import Events from './Events'
import Crypto from './lib/Crypto'

import ConnectRequest from './packets/simple/ConnectRequest'
import ConnectResponse from './packets/simple/ConnectResponse'

import LocalJoin from './packets/message/LocalJoin'

export default class Session {
    _client:Smartglass
    _socket:UdpSocket
    _events:Events
    _crypto:Crypto

    _socketTimeout = 0
    _socketTimeoutInterval

    _targetId = 0
    _sourceId = 0
    _sequenceNum = 0
  
    constructor(client:Smartglass){
        this._client = client
        this._socket = new UdpSocket(this)
        this._events = new Events()
        this._crypto = new Crypto()
    }

    create() {
        return new Promise((resolve, reject) => {
            this._client._logger.log('[Session.js create()] Creating new session')

            this._socket.create().then(() => {
                this._socketTimeout = Date.now()

                this._socketTimeoutInterval = setInterval(() => {
                    const timeoutTime = Date.now() - (1000 * 15)

                    // console.log('check timeout:', timeoutTime, '>', this._socketTimeout, '=', (this._socketTimeout - timeoutTime)/1000)

                    if(timeoutTime > this._socketTimeout) {
                        this._client._logger.log('[Session.ts create()] Session timed out after 15 seconds. Closing session')
                        this.close()
                    }
                }, 1000)

                resolve(true)

            }).catch((error) => {
                reject(error)
            })
        })
    }

    connect(ip, certificate) {
        return new Promise((resolve, reject) => {

            const server_cert = this._setupKeys(certificate)

            const context =this._crypto.signPublicKey(server_cert.keys.pubKeyHex)
            this._crypto.loadSecret(Buffer.from(context.secret, 'hex'))

            // Create connect request packet
            const uuid4 = Buffer.from(uuidParse.parse(uuidv4()))
            const request = new ConnectRequest({
                uuid: uuid4,
                pub_key_type: 0,
                pub_key: Buffer.from(context.public_key, 'hex'),
                iv: this._crypto._iv,
                request_group_end: 1,
            }, this._crypto)
            const requestPacket = request.toPacket()
            this.send(requestPacket, ip)

            this.once('_on_connect_response', (response) => {
                const responsePacket = new ConnectResponse(response.data, this._crypto)

                resolve({
                    ...response,
                    response: responsePacket,
                })

                this._sourceId = responsePacket.participant_id

                // console.log('Sending local join message')
                // Perrform local join
                const new_packet = new LocalJoin({
                    sequenceNum: this._getSequenceNum(),
                    target_id: this._targetId,
                    source_id: this._sourceId,
                    channel_id: Buffer.from('0000000000000000', 'hex'),
                    device_type: 8,
                    native_width: 600,
                    native_height: 1024,
                    client_version: 15,
                    os_major_version: 6,
                    os_minor_version: 2,
                    display_name: 'unknownskl/xbox-smartglass-node',
                    
                }, this._crypto)
                const reconstructed_packet = new_packet.toPacket()
                this.send(reconstructed_packet, ip)

                // console.log('Sended local join message')
            })
        })
    }

    send(data, ip) {
        return this._socket.send(data, ip)
    }

    close() {
        clearInterval(this._socketTimeoutInterval)
        return this._socket.close()
    }

    on(name, callback) {
        this._events.on(name, callback)
    }

    once(name, callback) {
        this._events.once(name, callback)
    }

    emit(name, data) {
        this._events.emit(name, data)
    }

    _setupKeys(der) {
        const pem = '-----BEGIN CERTIFICATE-----\n\r' +der.toString('base64').match(/.{0,64}/g).join('\n')+'-----END CERTIFICATE-----'
        const deviceCert = new jsrsasign.X509()
        deviceCert.readCertPEM(pem)

        const ecKey = jsrsasign.X509.getPublicKeyFromCertPEM(pem)

        return {
            certificate: deviceCert,
            keys: ecKey,
        }
    }

    _getSequenceNum() {
        this._sequenceNum++
        return this._sequenceNum
    }
}