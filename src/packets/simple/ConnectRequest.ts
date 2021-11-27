import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface ConnectRequestOptions {
    uuid:Buffer;
    pub_key_type:number;
    pub_key:Buffer;
    iv:Buffer;
    userhash?:string;
    jwt?:string;
    request_group_end?:number;
}

export default class ConnectRequest extends Packet {
    _crypto:Crypto

    uuid = Buffer.from('00000000000000000000000000000000', 'hex')
    pub_key_type = 0
    pub_key = Buffer.from('')
    iv = Buffer.from('')
    protected_payload = ''
    userhash = ''
    jwt = ''
    request_number = 0
    request_group_start = 0
    request_group_end = 2

    constructor(packet:Buffer | ConnectRequestOptions, crypto:Crypto){
        super('ConnectRequest')

        this._crypto = crypto

        if(packet instanceof Buffer){
            this.setPacket(packet)
            this.read('bytes', 2) // Read first 2 bytes (type)
            this.read('uint16') // Payload Length
            const protectedPayloadLength = this.read('uint16') // Protectedpayload Length
            this.read('uint16') // Version

            this.uuid = this.read('bytes', 16)
            this.pub_key_type = this.read('uint16')

            let pubkeySize = 0

            switch(this.pub_key_type){
                case 0x00:
                    // EC DH P256
                    pubkeySize = 65
                    break
                case 0x01:
                    // EC DH P384
                    pubkeySize = 97
                    break
                case 0x02:
                    // EC DH P521
                    pubkeySize = 133
                    break
            }

            this.pub_key = this.read('bytes', pubkeySize-1)
            this.iv = this.read('bytes', 16)
            this.protected_payload = this.read('remainder')

            const protected_payload_decrypted = this._crypto.decrypt(this.protected_payload.slice(0, -32), undefined, this.iv).slice(0, protectedPayloadLength)
            // console.log('protected_payload_decrypted:', protected_payload_decrypted)

            const protected_payload = new Packet('protectedPayload')
            protected_payload.setPacket(protected_payload_decrypted)

            this.userhash = protected_payload.read('sgstring').toString()
            this.jwt = protected_payload.read('sgstring').toString()
            this.request_number = protected_payload.read('uint32')
            this.request_group_start = protected_payload.read('uint32')
            this.request_group_end = protected_payload.read('uint32')

        } else {

            this.uuid = packet.uuid || this.uuid
            this.pub_key_type = packet.pub_key_type || this.pub_key_type
            this.pub_key = packet.pub_key || this.pub_key
            this.iv = packet.iv || this.iv
            this.userhash = packet.userhash || this.userhash
            this.jwt = packet.jwt || this.jwt
            this.request_group_end = packet.request_group_end || this.request_group_end
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('sgstring', this.userhash)
        protected_payload_decoded.write('sgstring', this.jwt)
        protected_payload_decoded.write('uint32', this.request_number)
        protected_payload_decoded.write('uint32', this.request_group_start)
        protected_payload_decoded.write('uint32', this.request_group_end)

        // console.log('protected_payload_decoded', protected_payload_decoded)

        const payloadLength = protected_payload_decoded.getOffset()
        const protected_payload = this._crypto.encrypt(protected_payload_decoded.getPacket(payloadLength), undefined, this.iv)

        // Write packet header
        this.write('bytes', Buffer.from('cc00', 'hex')) // Packet type (ConnectRequest)
        this.write('uint16', (this.uuid.length + 2 + this.pub_key.length + this.iv.length)) // Payloadlength
        this.write('uint16', payloadLength) // ProtectedPayloadlength
        this.write('uint16', 2) // Version = 2

        // Write unprotected payload
        this.write('bytes', this.uuid)
        this.write('uint16', this.pub_key_type)

        // console.log('this.pub_key.length', this.pub_key.length)
        if(this.pub_key.length != 64){
            console.log('WARNING: pub_key is not 64 bytes!')
        }
        this.write('bytes', this.pub_key)
        this.write('bytes', this.iv)

        // Write protected payload
        this.write('bytes', protected_payload)

        const signature = this._crypto.sign(this.getPacket().slice(0, this.getOffset()))
        this.write('bytes', signature)

        return this.getPacket().slice(0, this.getOffset())
    }
}