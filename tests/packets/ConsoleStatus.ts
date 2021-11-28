import { expect } from 'chai'
import fs from 'fs'

import Crypto from '../../src/lib/Crypto'
import ConsoleStatus from '../../src/packets/message/ConsoleStatus'

const packet_data = fs.readFileSync('tests/data/packets/console_status')

describe('ConsoleStatus', () => {

    it('should read a ConsoleStatus packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        const packet = new ConsoleStatus(packet_data, crypto)

        expect(packet.getType()).equal('ConsoleStatus')

        expect(packet.channel_id).to.deep.equal(Buffer.from('0000000000000000', 'hex'))
        expect(packet.target_id).equal(31)
        expect(packet.source_id).equal(0)
        expect(packet.flags).equal(40990)

        expect(packet.tv_provider).equal(0)
        expect(packet.major_version).equal(10)
        expect(packet.minor_version).equal(0)
        expect(packet.build).equal(14393)
        expect(packet.locale).equal('en-US')

        expect(packet.activeTitles[0].title_id).equal(714681658)
        expect(packet.activeTitles[0].title_disposition).equal(32771)
        expect(packet.activeTitles[0].product_id).to.deep.equal(Buffer.from('00000000000000000000000000000000', 'hex'))
        expect(packet.activeTitles[0].sandbox_id).to.deep.equal(Buffer.from('00000000000000000000000000000000', 'hex'))
        expect(packet.activeTitles[0].aum_id).equal('Xbox.Home_8wekyb3d8bbwe!Xbox.Home.Application')
    })

    it('should repack a ConsoleStatus packet', () => {
        const crypto = new Crypto()
        crypto.loadSecret(Buffer.from('82bba514e6d19521114940bd65121af234c53654a8e67add7710b3725db44f7730ed8e3da7015a09fe0f08e9bef3853c0506327eb77c9951769d923d863a2f5e', 'hex'))
        
        const packet = new ConsoleStatus(packet_data, crypto)
        expect(packet.getType()).equal('ConsoleStatus')

        const new_packet = new ConsoleStatus({
            sequenceNum: packet.sequenceNum,
            target_id: packet.target_id,
            source_id: packet.source_id,
            flags: packet.flags,
            channel_id: packet.channel_id,

            tv_provider: packet.tv_provider,
            major_version: packet.major_version,
            minor_version: packet.minor_version,
            build: packet.build,
            locale: packet.locale,
            activeTitles: packet.activeTitles
            
        }, crypto)
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})