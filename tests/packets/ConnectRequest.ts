import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import ConnectRequest from '../../src/packets/simple/ConnectRequest'

const packet_data = fs.readFileSync('tests/data/packets/connect_request')

describe('ConnectRequest', () => {

    it('should read a ConnectRequest packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new ConnectRequest(packet_data, crypto)

        expect(packet.getType()).equal('ConnectRequest')

        // console.log(packet, packet.iv)
        expect(packet.iv).to.deep.equal(Buffer.from('2979d25ea03d97f58f46930a288bf5d2', 'hex'))
        expect(packet.uuid).to.deep.equal(Buffer.from('de305d5475b4431badb2eb6b9e546014', 'hex'))
        expect(packet.userhash).equal('deadbeefdeadbeefde')
        expect(packet.jwt).equal('dummy_token')
        expect(packet.request_number).equal(0)
        expect(packet.request_group_start).equal(0)
        expect(packet.request_group_end).equal(2)
    })

    it('should repack a ConnectRequest packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new ConnectRequest(packet_data, crypto)
        expect(packet.getType()).equal('ConnectRequest')

        // console.log(packet.uuid)

        const new_packet = new ConnectRequest({
            uuid: packet.uuid,
            pub_key_type: packet.pub_key_type,
            pub_key: packet.pub_key,
            iv: packet.iv,
            userhash: packet.userhash,
            jwt: packet.jwt,

        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})