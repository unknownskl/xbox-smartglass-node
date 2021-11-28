import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import ChannelRequest from '../../src/packets/message/ChannelRequest'

const packet_data = fs.readFileSync('tests/data/packets/start_channel_request')

describe('ChannelRequest', () => {

    it('should read a ChannelRequest packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new ChannelRequest(packet_data, crypto)

        expect(packet.getType()).equal('ChannelRequest')

        expect(packet.channel_id).to.deep.equal(Buffer.from('0000000000000000', 'hex'))
        expect(packet.sequenceNum).equal(2)
        expect(packet.target_id).equal(0)
        expect(packet.source_id).equal(31)
        expect(packet.flags).equal(40998)

        expect(packet.channel_request_id).equal(1)
        expect(packet.title_id).equal(0)
        expect(packet.channel_guid).to.deep.equal(Buffer.from('fa20b8ca66fb46e0adb60b978a59d35f', 'hex'))
        expect(packet.activity_id).equal(0)
    })

    it('should repack a ChannelRequest packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new ChannelRequest(packet_data, crypto)
        expect(packet.getType()).equal('ChannelRequest')

        const new_packet = new ChannelRequest({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,
            
            channel_request_id: packet.channel_request_id,
            title_id: packet.title_id,
            channel_guid: packet.channel_guid,
            activity_id: packet.activity_id,
        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})