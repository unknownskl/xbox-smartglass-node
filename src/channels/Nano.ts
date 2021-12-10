import Session from '../lib/Session'

import ChannelRequest from '../packets/message/ChannelRequest'
import ChannelResponse from '../packets/message/ChannelResponse'

export default class Nano {

    _id
    _session
    _channel_id = 0

    _connected = false

    load(session:Session, channelNum) {
        this._session = session
        this._id = channelNum
        this._session._client._logger.log('[channels/Nano.ts] Creating Nano manager (' + this._id + ')')

        this.open().then((result) => {
            this._session._client._logger.log('[channels/Nano.ts] Channel opened  successfully')

        }).catch((error) => {
            this._session._client._logger.log('[channels/Nano.ts] Failed to open channel')
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
                channel_guid: Buffer.from('b6a117d8f5e245d7862e8fd8e3156476', 'hex'),
                activity_id: 0,
            }, this._session._crypto)

            this._session._client._logger.log('[Client -> Server] [' + channnel_req.sequenceNum + '] ChannelRequest:', channnel_req.channel_request_id, channnel_req.channel_guid)
            const channnel_req_packet = channnel_req.toPacket()

            this._session.on('_on_channel_response', (response) => {
                const res = new ChannelResponse(response.data, this._session._crypto)

                if(res.channel_request_id === this._id){
                    if(res.result === 0){
                        this._session._client._logger.log('[channels/Nano.ts] [' + res.sequenceNum + '] channel_response: Result ok! Channel opened.', res)
                        this._connected = true
                        this._channel_id = res.target_channel_id

                        resolve(res)

                    } else {
                        this._session._client._logger.log('[channels/Nano.ts] [' + res.sequenceNum + '] channel_response: Result failed!', res)
                        reject(res)
                    }
                } else {
                    this._session._client._logger.log('[channels/Nano.ts] [' + res.sequenceNum + '] channel_response: target_id mismatch:', this._id, res.channel_request_id)
                }
            })

            this._session.send(channnel_req_packet)
        })
    }

    // sendCommand(button) {
    //     this._session._client._logger.log('[channels/Nano.ts] Send button press:', button)

    //     return new Promise((resolve, reject) => {
    //         if(this._connected === true) {

    //             if(this._button_map[button] !== undefined){
    //                 const timestamp = new Date().getTime()
    //                 const key_request = new Gamepad({
    //                     sequenceNum: this._session._getSequenceNum(),
    //                     target_id: this._session._targetId,
    //                     source_id: this._session._sourceId,
    //                     channel_id: this._channel_id,

    //                     timestamp: timestamp,
    //                     buttons: this._button_map[button],
    //                 }, this._session._crypto)

    //                 console.log('key_request', key_request)

    //                 this._session.send(key_request.toPacket(), this._session._ip)

    //                 setTimeout(() => {
    //                     const timestamp = new Date().getTime()
    //                     const key_request_unpress = new Gamepad({
    //                         sequenceNum: this._session._getSequenceNum(),
    //                         target_id: this._session._targetId,
    //                         source_id: this._session._sourceId,
    //                         channel_id: this._channel_id,

    //                         timestamp: timestamp,
    //                         buttons: 0,
    //                     }, this._session._crypto)

    //                     console.log('key_request_unpress', key_request_unpress)

    //                     this._session.send(key_request_unpress.toPacket(), this._session._ip)

    //                     resolve({
    //                         status: 'ok_gamepad_send',
    //                         params: {
    //                             button: button,
    //                         },
    //                     })

    //                 }, 100)
                    
    //             } else {
    //                 this._session._client._logger.log('[channels/Nano.ts] Failed to send button. Reason: Unknown button type:', button)

    //                 reject({
    //                     status: 'error_channel_disconnected',
    //                     error: 'Unkown button: ' + button,
    //                     buttons: this._button_map,
    //                 })
    //             }

    //         } else {
    //             reject({
    //                 status: 'error_channel_disconnected',
    //                 error: 'Channel not ready: Nano',
    //             })
    //         }
    //     })
    // }
}