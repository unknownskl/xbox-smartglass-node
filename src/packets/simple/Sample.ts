import Packet from '../../lib/Packet'

export interface DiscoveryRequestOptions {
    timestamp?:number;
    server_guid?:string;
    magic?:Buffer;
    motd:string;
}

export default class DiscoveryRequest extends Packet {
    timestamp:number
    server_guid:string
    magic:Buffer
    motd:string

    constructor(packet:Buffer | DiscoveryRequestOptions){
        super('DiscoveryRequest')

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 1) // Read first byte

            this.timestamp = this.read('long')
            this.server_guid = Buffer.from(this.read('bytes', 8)).toString('hex')
            this.magic = this.read('bytes', 16)
            const motdLength = this.read('uint16')
            this.motd = Buffer.from(this.read('bytes', motdLength)).toString()

        } else {
            this.timestamp = packet.timestamp || 0
            this.magic = packet.magic || Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex')
            this.server_guid = packet.server_guid || '0000000000000000'
            this.motd = packet.motd || ''
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        this.write('bytes', Buffer.from('1c', 'hex'))
        this.write('long', this.timestamp)
        this.write('bytes', Buffer.from(this.server_guid, 'hex'))
        this.write('bytes', this.magic)
        this.write('uint16', this.motd.length)
        this.write('bytes', Buffer.from(this.motd))

        return this.getPacket().slice(0, this.getOffset())
    }
}