import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import ConnectResponse from '../../src/packets/simple/ConnectResponse'

const packet_data = fs.readFileSync('tests/data/packets/connect_response')

describe('ConnectResponse', () => {

    it('should read a ConnectResponse packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new ConnectResponse(packet_data, crypto)

        expect(packet.getType()).equal('ConnectResponse')

        expect(packet.iv).to.deep.equal(Buffer.from('c6373202bdfd1167cf9693491d22322a', 'hex'))
        expect(packet.connection_result).equal(0)
        expect(packet.pairing_state).equal(0)
        expect(packet.participant_id).equal(31)
    })

    it('should repack a ConnectResponse packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new ConnectResponse(packet_data, crypto)
        expect(packet.getType()).equal('ConnectResponse')

        const new_packet = new ConnectResponse({
            iv: packet.iv,
            connection_result: packet.connection_result,
            pairing_state: packet.pairing_state,
            participant_id: packet.participant_id,

        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})