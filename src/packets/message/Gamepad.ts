import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface GamepadOptions {
    sequenceNum:number;
    target_id:number;
    source_id:number;
    flags?:number;
    channel_id:number;

    timestamp?:number;
    buttons:number;
    left_trigger?:number;
    right_trigger?:number;
    left_thumb_x?:number;
    left_thumb_y?:number;
    right_thumb_x?:number;
    right_thumb_y?:number;
}

export default class Gamepad extends Packet {
    _crypto:Crypto

    sequenceNum = 0
    target_id = 0
    source_id = 0
    flags = 36618
    channel_id = 0
    protected_payload = ''

    timestamp = 0
    buttons = 0
    left_trigger = 0
    right_trigger = 0
    left_thumb_x = 0
    left_thumb_y = 0
    right_thumb_x = 0
    right_thumb_y = 0

    constructor(packet:Buffer | GamepadOptions, crypto:Crypto){
        super('Gamepad')

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

            this.timestamp = protected_payload.read('long')
            this.buttons = protected_payload.read('uint16')
            this.left_trigger = protected_payload.read('uint32')
            this.right_trigger = protected_payload.read('uint32')
            this.left_thumb_x = protected_payload.read('uint32')
            this.left_thumb_y = protected_payload.read('uint32')
            this.right_thumb_x = protected_payload.read('uint32')
            this.right_thumb_y = protected_payload.read('uint32')

        } else {

            this.sequenceNum = packet.sequenceNum || this.sequenceNum
            this.target_id = packet.target_id || this.target_id
            this.source_id = packet.source_id || this.source_id
            this.flags = packet.flags || this.flags
            this.channel_id = packet.channel_id || this.channel_id

            this.timestamp = packet.timestamp || this.timestamp
            this.buttons = packet.buttons || this.buttons
            this.left_trigger = packet.left_trigger || this.left_trigger
            this.right_trigger = packet.right_trigger || this.right_trigger
            this.left_thumb_x = packet.left_thumb_x || this.left_thumb_x
            this.left_thumb_y = packet.left_thumb_y || this.left_thumb_y
            this.right_thumb_x = packet.right_thumb_x || this.right_thumb_x
            this.right_thumb_y = packet.right_thumb_y || this.right_thumb_y
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('long', this.timestamp)
        protected_payload_decoded.write('uint16', this.buttons)
        protected_payload_decoded.write('uint32', this.left_trigger)
        protected_payload_decoded.write('uint32', this.right_trigger)
        protected_payload_decoded.write('uint32', this.left_thumb_x)
        protected_payload_decoded.write('uint32', this.left_thumb_y)
        protected_payload_decoded.write('uint32', this.right_thumb_x)
        protected_payload_decoded.write('uint32', this.right_thumb_y)

        const payloadLength = protected_payload_decoded.getOffset()

        // Write packet header
        this.write('bytes', Buffer.from('d00d', 'hex')) // Packet type (Gamepad)
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