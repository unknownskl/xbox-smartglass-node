import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import Acknowledgement from '../../src/packets/message/Acknowledgement'

const packet_data = fs.readFileSync('tests/data/packets/acknowledge')

describe('Acknowledgement', () => {

    it('should read a Acknowledgement packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new Acknowledgement(packet_data, crypto)

        expect(packet.getType()).equal('Acknowledgement')

        expect(packet.channel_id).to.deep.equal(Buffer.from('1000000000000000', 'hex'))
        expect(packet.low_watermark).equal(0)
        expect(packet.target_id).equal(31)
        expect(packet.source_id).equal(0)
        expect(packet.flags).equal(32769)

        expect(packet.low_watermark).equal(0)
        expect(packet.processed).to.deep.equal([ 1 ])
        expect(packet.rejected).to.deep.equal([ ])
    })

    it('should repack a Acknowledgement packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new Acknowledgement(packet_data, crypto)
        expect(packet.getType()).equal('Acknowledgement')

        const new_packet = new Acknowledgement({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,

            low_watermark: packet.low_watermark,
            processed: packet.processed,
            rejected: packet.rejected,
            
        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})