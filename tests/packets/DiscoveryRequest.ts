import DiscoveryRequest from '../../src/packets/simple/DiscoveryRequest'
import { expect } from 'chai'
import fs from 'fs'

const packet_data = fs.readFileSync('tests/data/packets/discovery_request')

describe('DiscoveryRequest', () => {

    it('should read a DiscoveryRequest packet', () => {
        const packet = new DiscoveryRequest(packet_data)

        expect(packet.getType()).equal('DiscoveryRequest')

        expect(packet.flags).equal(0)
        expect(packet.client).equal(8)
        expect(packet.min_version).equal(0)
        expect(packet.max_version).equal(2)
    })

    it('should repack a DiscoveryRequest packet', () => {
        const packet = new DiscoveryRequest(packet_data)
        expect(packet.getType()).equal('DiscoveryRequest')

        const new_packet = new DiscoveryRequest({
            client: 0x08,
        })
        const reconstructed_packet = new_packet.toPacket()

        expect(reconstructed_packet.toString('hex')).equal(packet_data.toString('hex'))
    })

})