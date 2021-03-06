import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface ChannelRequestOptions {
    sequenceNum:number;
    target_id:number;
    source_id:number;
    flags?:number;
    channel_id:number;

    channel_request_id?:number;
    title_id?:number;
    channel_guid:Buffer;
    activity_id?:number;
}

export default class ChannelRequest extends Packet {
    _crypto:Crypto

    sequenceNum = 0
    target_id = 0
    source_id = 0
    flags = 40998
    channel_id = 0
    protected_payload = ''

    channel_request_id = 0
    title_id = 0
    channel_guid = Buffer.from('00000000000000000000000000000000', 'hex')
    activity_id = 0

    constructor(packet:Buffer | ChannelRequestOptions, crypto:Crypto){
        super('ChannelRequest')

        this._crypto = crypto

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 2) // Read first 2 bytes (type)
            const protectedPayloadLength = this.read('uint16') // Protectedpayload Length
            this.sequenceNum = this.read('uint32') // Sequence num
            this.target_id = this.read('uint32') // Target Participant Id
            this.source_id = this.read('uint32') // Source Participant Id
            this.flags = this.read('uint16') // Flags
            this.channel_id = this.read('long') // Channel ID

            this.protected_payload = this.read('remainder')

            const key = this._crypto.encrypt(packet.slice(0, 16), this._crypto._iv)
            const protected_payload_decrypted = this._crypto.decrypt(this.protected_payload.slice(0, -32), undefined, key).slice(0, protectedPayloadLength)

            const protected_payload = new Packet('protectedPayload')
            protected_payload.setPacket(protected_payload_decrypted)

            this.channel_request_id = protected_payload.read('uint32')
            this.title_id = protected_payload.read('uint32')
            this.channel_guid = protected_payload.read('bytes', 16)
            this.activity_id = protected_payload.read('uint32')

        } else {

            this.sequenceNum = packet.sequenceNum || this.sequenceNum
            this.target_id = packet.target_id || this.target_id
            this.source_id = packet.source_id || this.source_id
            this.flags = packet.flags || this.flags
            this.channel_id = packet.channel_id || this.channel_id

            this.channel_request_id = packet.channel_request_id || this.channel_request_id
            this.title_id = packet.title_id || this.title_id
            this.channel_guid = packet.channel_guid || this.channel_guid
            this.activity_id = packet.activity_id || this.activity_id

        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('uint32', this.channel_request_id)
        protected_payload_decoded.write('uint32', this.title_id)
        protected_payload_decoded.write('bytes', this.channel_guid)
        protected_payload_decoded.write('uint32', this.activity_id)

        const payloadLength = protected_payload_decoded.getOffset()

        // Write packet header
        this.write('bytes', Buffer.from('d00d', 'hex')) // Packet type (ChannelRequest)
        this.write('uint16', payloadLength) // ProtectedPayloadlength
        // this.write('uint16', 2) // Version = 2

        // Write unprotected payload
        this.write('uint32', this.sequenceNum) // Sequence num
        this.write('uint32', this.target_id) // Target Participant Id
        this.write('uint32', this.source_id) // Source Participant Id
        this.write('uint16', this.flags) // Flags
        this.write('long', this.channel_id) // Channel ID

        // Write protected payload
        const key = this._crypto.encrypt(this.getPacket(16), this._crypto._iv)
        const protected_payload = this._crypto.encrypt(protected_payload_decoded.getPacket(payloadLength), undefined, key)
        this.write('bytes', protected_payload)

        const signature = this._crypto.sign(this.getPacket().slice(0, this.getOffset()))
        this.write('bytes', signature)

        return this.getPacket().slice(0, this.getOffset())
    }
}