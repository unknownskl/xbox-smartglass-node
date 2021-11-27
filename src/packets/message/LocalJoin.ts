import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface LocalJoinOptions {
    sequenceNum:number;
    target_id:number;
    source_id:number;
    flags:number;
    channel_id:Buffer;

    device_type:number;
    native_width:number;
    native_height:number;
    dpi_x?:number;
    dpi_y?:number;
    device_capabilities?:Buffer;
    client_version:number;
    os_major_version:number;
    os_minor_version:number;
    display_name:string;
}

export default class LocalJoin extends Packet {
    _crypto:Crypto

    sequenceNum = 0
    target_id = 0
    source_id = 0
    flags = 0
    channel_id = Buffer.from('0000000000000000', 'hex')
    protected_payload = ''

    device_type = 0
    native_width = 0
    native_height = 0
    dpi_x = 160
    dpi_y = 160
    device_capabilities = Buffer.from('ffffffffffffffff', 'hex')
    client_version = 0
    os_major_version = 0
    os_minor_version = 0
    display_name = ''

    constructor(packet:Buffer | LocalJoinOptions, crypto:Crypto){
        super('LocalJoin')

        this._crypto = crypto

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 2) // Read first 2 bytes (type)
            const protectedPayloadLength = this.read('uint16') // Protectedpayload Length
            this.sequenceNum = this.read('uint32') // Sequence num
            this.target_id = this.read('uint32') // Target Participant Id
            this.source_id = this.read('uint32') // Source Participant Id
            this.flags = this.read('uint16') // Flags
            this.channel_id = this.read('bytes', 8) // Channel ID

            this.protected_payload = this.read('remainder')

            const key = this._crypto.encrypt(packet.slice(0, 16), this._crypto._iv)
            const protected_payload_decrypted = this._crypto.decrypt(this.protected_payload.slice(0, -32), undefined, key).slice(0, protectedPayloadLength)

            const protected_payload = new Packet('protectedPayload')
            protected_payload.setPacket(protected_payload_decrypted)

            this.device_type = protected_payload.read('uint16')
            this.native_width = protected_payload.read('uint16')
            this.native_height = protected_payload.read('uint16')
            this.dpi_x = protected_payload.read('uint16')
            this.dpi_y = protected_payload.read('uint16')
            this.device_capabilities = protected_payload.read('bytes', 8)
            this.client_version = protected_payload.read('uint32')
            this.os_major_version = protected_payload.read('uint32')
            this.os_minor_version = protected_payload.read('uint32')
            this.display_name = protected_payload.read('sgstring').toString()

            // this.pairing_state = protected_payload.read('uint16')
            // this.participant_id = protected_payload.read('uint32')

        } else {

            this.sequenceNum = packet.sequenceNum || this.sequenceNum
            this.target_id = packet.target_id || this.target_id
            this.source_id = packet.source_id || this.source_id
            this.flags = packet.flags || this.flags
            this.channel_id = packet.channel_id || this.channel_id

            this.device_type = packet.device_type || this.device_type
            this.native_width = packet.native_width || this.native_width
            this.native_height = packet.native_height || this.native_height
            this.dpi_x = packet.dpi_x || this.dpi_x
            this.dpi_y = packet.dpi_y || this.dpi_y
            this.device_capabilities = packet.device_capabilities || this.device_capabilities
            this.client_version = packet.client_version || this.client_version
            this.os_major_version = packet.os_major_version || this.os_major_version
            this.os_minor_version = packet.os_minor_version || this.os_minor_version
            this.display_name = packet.display_name || this.display_name

        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('uint16', this.device_type)
        protected_payload_decoded.write('uint16', this.native_width)
        protected_payload_decoded.write('uint16', this.native_height)
        protected_payload_decoded.write('uint16', this.dpi_x)
        protected_payload_decoded.write('uint16', this.dpi_y)
        protected_payload_decoded.write('bytes', this.device_capabilities)
        protected_payload_decoded.write('uint32', this.client_version)
        protected_payload_decoded.write('uint32', this.os_major_version)
        protected_payload_decoded.write('uint32', this.os_minor_version)
        protected_payload_decoded.write('sgstring', this.display_name)

        const payloadLength = protected_payload_decoded.getOffset()

        // Write packet header
        this.write('bytes', Buffer.from('d00d', 'hex')) // Packet type (LocalJoin)
        this.write('uint16', payloadLength) // ProtectedPayloadlength
        // this.write('uint16', 2) // Version = 2

        // Write unprotected payload
        // this.write('bytes', this.iv)
        this.write('uint32', this.sequenceNum) // Sequence num
        this.write('uint32', this.target_id) // Target Participant Id
        this.write('uint32', this.source_id) // Source Participant Id
        this.write('uint16', this.flags) // Flags
        this.write('bytes', this.channel_id) // Channel ID

        // Write protected payload
        const key = this._crypto.encrypt(this.getPacket(16), this._crypto._iv)
        const protected_payload = this._crypto.encrypt(protected_payload_decoded.getPacket(payloadLength), undefined, key)
        this.write('bytes', protected_payload)

        const signature = this._crypto.sign(this.getPacket().slice(0, this.getOffset()))
        this.write('bytes', signature)

        return this.getPacket().slice(0, this.getOffset())
    }
}