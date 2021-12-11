import jsrsasign from 'jsrsasign'
import uuidParse from 'uuid-parse'
import { v4 as uuidv4 } from 'uuid'

import Smartglass from '../Smartglass'
import UdpSocket from '../UdpSocket'
import Events from '../Events'
import Crypto from '../lib/Crypto'
import Router from '../lib/Router'

import ConnectRequest from '../packets/simple/ConnectRequest'
import ConnectResponse from '../packets/simple/ConnectResponse'

import LocalJoin from '../packets/message/LocalJoin'
import Acknowledgement from '../packets/message/Acknowledgement'
import ConsoleStatus from '../packets/message/ConsoleStatus'

import SystemInputChannel from '../channels/SystemInput'
import SystemMediaChannel from '../channels/SystemMedia'
import TvRemoteChannel from '../channels/TvRemote'
// import NanoChannel from '../channels/Nano'

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
    _ip

    _lowWatermark = 0
    _lastAckedId = 0
    _ackMessages: Array<number> = []
    _ackInterval
    _managers = {}
  
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

                // Setup timeouts

                this._socketTimeout = Date.now()

                this._socketTimeoutInterval = setInterval(() => {
                    const timeoutTime = Date.now() - (1000 * 15)

                    // console.log('check timeout:', timeoutTime, '>', this._socketTimeout, '=', (this._socketTimeout - timeoutTime)/1000)

                    if(timeoutTime > this._socketTimeout) {
                        this.emit('_on_timeout', {
                            error: 'Session timeout',
                            timeout: 15,
                        })
                        this._client._logger.log('[Session.ts create()] Session timed out after 15 seconds. Closing session')
                        this.close()
                    }
                }, 1000)

                // Setup packet routing

                this.on('_on_packet', (message) => {
                    this._socketTimeout = Date.now()

                    const router = new Router(this)
                    router.parse(message.data).then((packetType) => {
                        console.log('Routed packet: '+packetType)

                        this.emit('_on_' + packetType, {
                            data: message.data,
                            remote: message.remote,
                        })

                    }).catch((error) => {
                        console.log('Failed to match packet!')
                    })
                })

                this.on('_on_console_status', (message) => {
                    // Check if we already have this id in the queue
                    const console_status = new ConsoleStatus(message.data, this._crypto)
                    this._client._logger.log('[Server -> Client] [' + console_status.sequenceNum + '] ConsoleStatus aud_id:', console_status.activeTitles[0].aum_id, 'build:', console_status.build )
                    // console.log('Got console status', message, console_status)
                })

                this.on('_on_acknowledgement', (message) => {
                    // Check if we already have this id in the queue
                    const ack = new Acknowledgement(message.data, this._crypto)
                    this._client._logger.log('[Server -> Client] [' + ack.sequenceNum + '] Acknowledged:', ack.processed, 'Rejected:', ack.rejected, 'low_watermark:', ack.low_watermark)

                    for(let i = 0; i < ack.processed.length; i++){
                        this.emit('_ack_id_' + ack.processed[i], { id: ack.processed[i], status: 'processed' })
                    }
                })

                // Setup ack system

                this.on('_ack_message', (message) => {
                    // Check if we already have this id in the queue
                    if((! this._ackMessages.includes(message.id)) ){ //&& message.id > this._lastAckedId){
                        this._ackMessages.push(message.id)
                        // this._lastAckedId = message.id
                    }
                })

                resolve(true)

            }).catch((error) => {
                reject(error)
            })
        })
    }

    isConnected() {
        const timeoutTime = Date.now() - (1000 * 15)

        if(timeoutTime > this._socketTimeout) {
            return false
        } else {
            return true
        }
    }

    connect(ip, certificate) {
        this._ip = ip

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
            this._client._logger.log('[Client -> Server] [0] ConnectRequest public key:', request.pub_key, 'iv:', request.iv)
            const requestPacket = request.toPacket()
            this.send(requestPacket, ip)

            this.once('_on_connect_response', (response) => {
                const responsePacket = new ConnectResponse(response.data, this._crypto)

                this._sourceId = responsePacket.participant_id

                // console.log('Sending local join message')
                // Perrform local join
                const localjoin = new LocalJoin({
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
                this._client._logger.log('[Client -> Server] [' + localjoin.sequenceNum + '] LocalJoin:', localjoin.display_name)
                const localjoin_packet = localjoin.toPacket()
                this.send(localjoin_packet, ip)

                this.once('_ack_id_' + localjoin.sequenceNum, (ack) => {
                    console.log('Local join acknowledged. Lets open the channels...')

                    const channels = {
                        'system_input': new SystemInputChannel(),
                        'system_media': new SystemMediaChannel(),
                        'tv_remote': new TvRemoteChannel(),
                        // 'nano': new NanoChannel(),
                    }

                    for(const channel in channels){
                        this.addManager(channel, channels[channel])
                    }

                    setTimeout(() => {
                        // Timeout resolve to let the channels open
                        resolve({
                            ...response,
                            response: responsePacket,
                        })
                    }, 1000)
                })

                // console.log('Sended local join message')
            })

            // Ack messages interval

            this._ackInterval = setInterval(() => {
                // Check if we have packets to ack...
                if(this._ackMessages.length > 0){
                    // We have messages to ack!

                    const ack = new Acknowledgement({
                        sequenceNum: this._getSequenceNum(),
                        target_id: this._targetId,
                        source_id: this._sourceId,
                        channel_id: Buffer.from('0000000000000000', 'hex'),
            
                        low_watermark: this._lowWatermark,
                        processed: this._ackMessages,
                        rejected: [],
                        
                    }, this._crypto)
                    
                    const ackPacket = ack.toPacket()
                    this._client._logger.log('[Client -> Server] [' + ack.sequenceNum + '] Acknowledge:', ack.processed, 'Rejected:', ack.rejected, 'low_watermark:', ack.low_watermark)

                    // Reset ack messages queue
                    this._ackMessages = []

                    this.send(ackPacket, ip)
                }
            }, 100)
        })
    }

    send(data, ip?:string) {
        if(ip === undefined){
            ip = this._ip
        }
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

    addManager(name, manager) {
        this._client._logger.log('[lib/Session.ts] Loaded manager: '+name + '('+Object.keys(this._managers).length+')')
        this._managers[name] = manager
        this._managers[name].load(this, Object.keys(this._managers).length)
    }

    getManager(name) {
        if(this._managers[name] !== undefined){
            return this._managers[name]
        } else {
            return false
        }
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

    _setLowWatermark(num) {
        if(num > this._lowWatermark){
            this._lowWatermark = num
        }
    }
}