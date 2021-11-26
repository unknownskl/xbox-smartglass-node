import Packet from '../../lib/Packet'

export interface DiscoveryRequestOptions {
    client?:number;
}

export default class DiscoveryRequest extends Packet {
    flags = 0
    client:number
    min_version = 0
    max_version = 2

    constructor(packet:Buffer | DiscoveryRequestOptions){
        super('DiscoveryRequest')

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 6) // Read first 6 byte (header)

            this.flags = this.read('uint32')
            this.client = this.read('uint16')
            this.min_version = this.read('uint16')
            this.max_version = this.read('uint16')

        } else {
            this.client = packet.client || 0x03
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        this.write('bytes', Buffer.from('DD00', 'hex')) // Packet type (DiscoveryRequest)
        this.write('bytes', Buffer.from('000A', 'hex')) // Payloadlength
        this.write('bytes', Buffer.from('0000', 'hex')) // Version = 0
        this.write('uint32', this.flags)
        this.write('uint16', this.client)
        this.write('uint16', this.min_version)
        this.write('uint16', this.max_version)

        return this.getPacket().slice(0, this.getOffset())
    }
}