import Session from './Session'

export default class Router {

    _session:Session

    _messageTypes = {
        1: 'acknowledgement',
        3: 'local_join',
        30: 'console_status',
    }

    constructor(session:Session){
        this._session = session
    }

    parse(message) {
        return new Promise((resolve, reject) => {
            //
            const packetType = message.toString('hex').substr(0, 4)

            switch(packetType){
                case 'dd00':
                    resolve('discovery_request')
                    break
                case 'dd01':
                    resolve('discovery_reponse')
                    break
                case 'cc00':
                    resolve('connect_request')
                    break
                case 'cc01':
                    resolve('connect_response')
                    break
                case 'd00d':
                    if(this.detectMessageType(message) as any !== false){
                        resolve(this.detectMessageType(message))
                    } else {
                        reject({ error: 'Failed to recognize packet' })
                    }
                    break
            }

            if(packetType === 'd00d'){
                // This is a message packet
                resolve('message')

            } else {
                reject({ error: 'Failed to recognize packet' })
            }
        })
    }

    detectMessageType(message) {

        const flagsData = message.slice(16, 18)
        const sequence_num_buffer = message.slice(4, 8)
        const sequence_num = sequence_num_buffer.readUint32BE()

        const flags = this._readFlags(flagsData)

        // console.log('flagsData', flags, 'seq:', sequence_num)

        this._session._setLowWatermark(sequence_num)

        if(flags.need_ack){
            this._session.emit('_ack_message', { id: sequence_num })
        }

        if(flags.is_fragment){
            console.log('WARNING: GOT FRAGMENT MSG!')
        }

        return this._messageTypes[flags.type] || flags.type
    }

    _readFlags(flags) {
        flags = this._hexToBin(flags.toString('hex'))

        let need_ack = false
        let is_fragment = false

        if(flags.slice(2, 3) === '1'){
            need_ack = true
        }

        if(flags.slice(3, 4) === '1'){
            is_fragment = true
        }

        const type = parseInt(flags.slice(4, 16), 2)

        return {
            'version': parseInt(flags.slice(0, 2), 2).toString(),
            'need_ack': need_ack,
            'is_fragment': is_fragment,
            'type': type,
        }
    }

      
    _hexToBin(hex: string): string {
        let bin = ''
    
        const hexMap: Record<number | string, string> = {
            0: '0000',
            1: '0001',
            2: '0010',
            3: '0011',
            4: '0100',
            5: '0101',
            6: '0110',
            7: '0111',
            8: '1000',
            9: '1001',
            a: '1010',
            b: '1011',
            c: '1100',
            d: '1101',
            e: '1110',
            f: '1111',
        }

        for (const c of hex.toLowerCase()) {
            bin += hexMap[c]
        }
    
        return bin
    }
      
}