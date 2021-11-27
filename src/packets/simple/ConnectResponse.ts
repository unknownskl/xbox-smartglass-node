import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface ConnectResponseOptions {
    iv:Buffer;
    connection_result:number;
    pairing_state:number;
    participant_id:number;
}

export default class ConnectResponse extends Packet {
    _crypto:Crypto

    iv = Buffer.from('')
    protected_payload = ''
    connection_result = 0
    pairing_state = 0
    participant_id = 0

    constructor(packet:Buffer | ConnectResponseOptions, crypto:Crypto){
        super('ConnectResponse')

        this._crypto = crypto

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 2) // Read first 2 bytes (type)
            this.read('uint16') // Payload Length
            const protectedPayloadLength = this.read('uint16') // Protectedpayload Length
            this.read('uint16') // Version

            this.iv = this.read('bytes', 16)
            this.protected_payload = this.read('remainder')

            const protected_payload_decrypted = this._crypto.decrypt(this.protected_payload.slice(0, -32), undefined, this.iv).slice(0, protectedPayloadLength)

            const protected_payload = new Packet('protectedPayload')
            protected_payload.setPacket(protected_payload_decrypted)

            this.connection_result = protected_payload.read('uint16')
            this.pairing_state = protected_payload.read('uint16')
            this.participant_id = protected_payload.read('uint32')

        } else {

            this.iv = packet.iv || this.iv
            this.connection_result = packet.connection_result || this.connection_result
            this.pairing_state = packet.pairing_state || this.pairing_state
            this.participant_id = packet.participant_id || this.participant_id
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('uint16', this.connection_result)
        protected_payload_decoded.write('uint16', this.pairing_state)
        protected_payload_decoded.write('uint32', this.participant_id)

        const payloadLength = protected_payload_decoded.getOffset()
        const protected_payload = this._crypto.encrypt(protected_payload_decoded.getPacket(payloadLength), undefined, this.iv)

        // Write packet header
        this.write('bytes', Buffer.from('cc01', 'hex')) // Packet type (ConnectResponse)
        this.write('uint16', (this.iv.length)) // Payloadlength
        this.write('uint16', payloadLength) // ProtectedPayloadlength
        this.write('uint16', 2) // Version = 2

        // Write unprotected payload
        this.write('bytes', this.iv)

        // Write protected payload
        this.write('bytes', protected_payload)

        const signature = this._crypto.sign(this.getPacket().slice(0, this.getOffset()))
        this.write('bytes', signature)

        return this.getPacket().slice(0, this.getOffset())
    }
}