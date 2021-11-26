import DiscoveryResponse from '../../src/packets/simple/DiscoveryResponse'
import { expect } from 'chai'
import fs from 'fs'

const packet_data = fs.readFileSync('tests/data/packets/discovery_response')

describe('DiscoveryResponse', () => {

    it('should read a DiscoveryResponse packet', () => {
        const packet = new DiscoveryResponse(packet_data)

        expect(packet.getType()).equal('DiscoveryResponse')

        // console.log(packet)
        expect(packet.flags).equal(2)
        expect(packet.client).equal(1) // 1 = Xbox One
        expect(packet.name).equal('XboxOne')
        expect(packet.uuid).equal('DE305D54-75B4-431B-ADB2-EB6B9E546014')
        expect(packet.last_error).equal(0)
    })

    it('should repack a DiscoveryResponse packet', () => {
        const packet = new DiscoveryResponse(packet_data)
        expect(packet.getType()).equal('DiscoveryResponse')

        const new_packet = new DiscoveryResponse({
            name: packet.name,
            uuid: packet.uuid,
            certificate: packet.certificate,
        })
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})