import Session from '../lib/Session'

import ChannelRequest from '../packets/message/ChannelRequest'
import ChannelResponse from '../packets/message/ChannelResponse'
import Gamepad from '../packets/message/Gamepad'

export default class SystemInput {

    _id
    _session
    _channel_id = 0

    _connected = false

    _button_map = {
        a: 16,
        b: 32,
        x: 64,
        y: 128,
        up: 256,
        left: 1024,
        right: 2048,
        down: 512,
        nexus: 2,
        view: 4,
        menu: 8,
    }

    load(session:Session, channelNum) {
        this._session = session
        this._id = channelNum
        this._session._client._logger.log('[channels/SystemInput.ts] Creating SystemInput manager (' + this._id + ')')

        this.open().then((result) => {
            this._session._client._logger.log('[channels/SystemInput.ts] Channel opened  successfully')

        }).catch((error) => {
            this._session._client._logger.log('[channels/SystemInput.ts] Failed to open channel')
        })
    }

    open() {
        return new Promise((resolve, reject) => {
            const channnel_req = new ChannelRequest({
                sequenceNum: this._session._getSequenceNum(),
                target_id: this._session._targetId,
                source_id: this._session._sourceId,
                channel_id: this._channel_id,

                channel_request_id: this._id,
                title_id: 0,
                channel_guid: Buffer.from('fa20b8ca66fb46e0adb60b978a59d35f', 'hex'),
                activity_id: 0,
            }, this._session._crypto)

            this._session._client._logger.log('[Client -> Server] [' + channnel_req.sequenceNum + '] ChannelRequest:', channnel_req.channel_request_id, channnel_req.channel_guid)
            const channnel_req_packet = channnel_req.toPacket()

            this._session.on('_on_channel_response', (response) => {
                const res = new ChannelResponse(response.data, this._session._crypto)

                if(res.channel_request_id === this._id){
                    if(res.result === 0){
                        this._session._client._logger.log('[channels/SystemInput.ts] [' + res.sequenceNum + '] channel_response: Result ok! Channel opened.', res)
                        this._connected = true
                        this._channel_id = res.target_channel_id

                        const timestamp = new Date().getTime()
                        const key_request_unpress = new Gamepad({
                            sequenceNum: this._session._getSequenceNum(),
                            target_id: this._session._targetId,
                            source_id: this._session._sourceId,
                            channel_id: this._channel_id,

                            timestamp: timestamp,
                            buttons: 0,
                        }, this._session._crypto)

                        this._session.send(key_request_unpress.toPacket(), this._session._ip)

                        resolve(res)

                    } else {
                        this._session._client._logger.log('[channels/SystemInput.ts] [' + res.sequenceNum + '] channel_response: Result failed!', res)
                        reject(res)
                    }
                } else {
                    this._session._client._logger.log('[channels/SystemInput.ts] [' + res.sequenceNum + '] channel_response: target_id mismatch:', this._id, res.channel_request_id)
                }
            })

            this._session.send(channnel_req_packet)
        })
    }

    sendCommand(button) {
        this._session._client._logger.log('[channels/SystemInput.ts] Send button press:', button)

        return new Promise((resolve, reject) => {
            if(this._connected === true) {

                if(this._button_map[button] !== undefined){
                    const timestamp = new Date().getTime()
                    const key_request = new Gamepad({
                        sequenceNum: this._session._getSequenceNum(),
                        target_id: this._session._targetId,
                        source_id: this._session._sourceId,
                        channel_id: this._channel_id,

                        timestamp: timestamp,
                        buttons: this._button_map[button],
                    }, this._session._crypto)

                    console.log('key_request', key_request)

                    this._session.send(key_request.toPacket(), this._session._ip)

                    setTimeout(() => {
                        const timestamp = new Date().getTime()
                        const key_request_unpress = new Gamepad({
                            sequenceNum: this._session._getSequenceNum(),
                            target_id: this._session._targetId,
                            source_id: this._session._sourceId,
                            channel_id: this._channel_id,

                            timestamp: timestamp,
                            buttons: 0,
                        }, this._session._crypto)

                        console.log('key_request_unpress', key_request_unpress)

                        this._session.send(key_request_unpress.toPacket(), this._session._ip)

                        resolve({
                            status: 'ok_gamepad_send',
                            params: {
                                button: button,
                            },
                        })

                    }, 100)
                    
                } else {
                    this._session._client._logger.log('[channels/SystemInput.ts] Failed to send button. Reason: Unknown button type:', button)

                    reject({
                        status: 'error_channel_disconnected',
                        error: 'Unkown button: ' + button,
                        buttons: this._button_map,
                    })
                }

            } else {
                reject({
                    status: 'error_channel_disconnected',
                    error: 'Channel not ready: SystemInput',
                })
            }
        })
    }
}