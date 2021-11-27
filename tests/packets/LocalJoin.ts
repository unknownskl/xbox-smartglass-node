import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import LocalJoin from '../../src/packets/message/LocalJoin'

const packet_data = fs.readFileSync('tests/data/packets/local_join')

describe('LocalJoin', () => {

    it('should read a LocalJoin packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new LocalJoin(packet_data, crypto)

        expect(packet.getType()).equal('LocalJoin')

        expect(packet.channel_id).to.deep.equal(Buffer.from('0000000000000000', 'hex'))
        expect(packet.sequenceNum).equal(1)
        expect(packet.target_id).equal(0)
        expect(packet.source_id).equal(31)
        expect(packet.flags).equal(8195)

        expect(packet.device_type).equal(8)
        expect(packet.native_width).equal(600)
        expect(packet.native_height).equal(1024)
        expect(packet.dpi_x).equal(160)
        expect(packet.dpi_y).equal(160)
        expect(packet.device_capabilities).to.deep.equal(Buffer.from('ffffffffffffffff', 'hex'))
        expect(packet.client_version).equal(133713371)
        expect(packet.os_major_version).equal(42)
        expect(packet.os_minor_version).equal(0)
        expect(packet.display_name).equal('package.name.here')
    })

    it('should repack a LocalJoin packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new LocalJoin(packet_data, crypto)
        expect(packet.getType()).equal('LocalJoin')

        const new_packet = new LocalJoin({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,
            device_type: packet.device_type,
            native_width: packet.native_width,
            native_height: packet.native_height,
            client_version: packet.client_version,
            os_major_version: packet.os_major_version,
            os_minor_version: packet.os_minor_version,
            display_name: packet.display_name,
            
        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})