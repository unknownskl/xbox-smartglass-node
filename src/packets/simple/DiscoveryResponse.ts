import Packet from '../../lib/Packet'

export interface DiscoveryResponseOptions {
    client?:number;
    name:string;
    uuid?:string;
    last_error?:number;
    certificate?:string;
}

export default class DiscoveryResponse extends Packet {
    flags = 2
    client:number
    name:string
    uuid:string
    last_error:number
    certificate:string

    constructor(packet:Buffer | DiscoveryResponseOptions){
        super('DiscoveryResponse')

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 6) // Read first 6 bytes (header)

            this.flags = this.read('uint32')
            this.client = this.read('uint16')
            this.name = this.read('sgstring').toString()
            this.uuid = this.read('sgstring').toString()
            this.last_error = this.read('uint32')

            const certificateLength = this.read('uint16').toString()
            this.certificate = this.read('bytes', certificateLength)

        } else {
            this.client = packet.client || 0x01
            this.name = packet.name || 'Xbox-Smartglass-Node'
            this.uuid = packet.uuid || 'DE305D54-75B4-431B-ADB2-EB6B9E546014'
            this.last_error = packet.last_error || 0
            this.certificate = packet.certificate || ''
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        this.write('bytes', Buffer.from('DD01', 'hex')) // Packet type (DiscoveryResponse)
        this.write('uint16', (4 + 2 + (this.name.length + 3) + (this.uuid.length + 3) + 4 + 2 + this.certificate.length)) // Payloadlength
        this.write('uint16', 2) // Version = 2
        
        this.write('uint32', this.flags)
        this.write('uint16', this.client)
        this.write('sgstring', this.name)
        this.write('sgstring', this.uuid)
        this.write('uint32', this.last_error)
        this.write('uint16', this.certificate.length)
        this.write('bytes', this.certificate)

        return this.getPacket().slice(0, this.getOffset())
    }
}