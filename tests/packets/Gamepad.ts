import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import Gamepad from '../../src/packets/message/Gamepad'

const packet_data = fs.readFileSync('tests/data/packets/gamepad')

describe('Gamepad', () => {

    it('should read a Gamepad packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new Gamepad(packet_data, crypto)

        expect(packet.getType()).equal('Gamepad')

        // console.log(packet)

        expect(packet.channel_id).to.deep.equal(180)
        expect(packet.sequenceNum).equal(79)
        expect(packet.target_id).equal(0)
        expect(packet.source_id).equal(41)
        expect(packet.flags).equal(36618)


        expect(packet.timestamp).equal(0)
        expect(packet.buttons).equal(32) // PadB
        expect(packet.left_trigger).equal(0)
        expect(packet.right_trigger).equal(0)
        expect(packet.left_thumb_x).equal(0)
        expect(packet.left_thumb_y).equal(0)
        expect(packet.right_thumb_x).equal(0)
        expect(packet.right_thumb_y).equal(0)
    })

    it('should repack a Gamepad packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new Gamepad(packet_data, crypto)
        expect(packet.getType()).equal('Gamepad')

        const new_packet = new Gamepad({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,
            
            timestamp: packet.timestamp,
            buttons: packet.buttons,
            left_trigger: packet.left_trigger,
            right_trigger: packet.right_trigger,
            left_thumb_x: packet.left_thumb_x,
            left_thumb_y: packet.left_thumb_y,
            right_thumb_x: packet.right_thumb_x,
            right_thumb_y: packet.right_thumb_y,

        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})