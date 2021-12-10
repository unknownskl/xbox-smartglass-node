import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import Json from '../../src/packets/message/Json'

const packet_data = fs.readFileSync('tests/data/packets/json')

describe('Json', () => {

    it('should read a Json packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new Json(packet_data, crypto)

        expect(packet.getType()).equal('Json')

        expect(packet.channel_id).to.deep.equal(151)
        expect(packet.sequenceNum).equal(11)
        expect(packet.target_id).equal(0)
        expect(packet.source_id).equal(31)
        expect(packet.flags).equal(40988)

        expect(packet.json).equal('{"msgid":"2ed6c0fd.2","request":"GetConfiguration"}')
    })

    it('should repack a Json packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new Json(packet_data, crypto)
        expect(packet.getType()).equal('Json')

        const new_packet = new Json({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,
            
            json: packet.json,

        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})