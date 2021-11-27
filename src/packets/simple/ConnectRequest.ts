import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface ConnectRequestOptions {
    uuid?:string;
}

export default class ConnectRequest extends Packet {
    _crypto:Crypto

    uuid:string
    pub_key_type = -1
    pub_key = ''
    iv = ''
    protected_payload = ''
    userhash = ''
    jwt = ''
    request_number = 0
    request_group_start = 0
    request_group_end = 0

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
            // this.client = packet.client || 0x01
            // this.name = packet.name || 'Xbox-Smartglass-Node'
            this.uuid = packet.uuid || 'DE305D54-75B4-431B-ADB2-EB6B9E546014'
            // this.last_error = packet.last_error || 0
            // this.certificate = packet.certificate || ''
        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        this.write('bytes', Buffer.from('DD01', 'hex')) // Packet type (ConnectRequest)
        this.write('bytes', Buffer.from('0244', 'hex')) // Payloadlength
        this.write('bytes', Buffer.from('0244', 'hex')) // ProtectedPayloadlength
        this.write('bytes', Buffer.from('0002', 'hex')) // Version = 2
        // this.write('uint32', this.flags)
        // this.write('uint16', this.client)
        // this.write('sgstring', this.name)
        // this.write('sgstring', this.uuid)
        // this.write('uint32', this.last_error)
        // this.write('uint16', this.certificate.length)
        // this.write('bytes', this.certificate)

        return this.getPacket().slice(0, this.getOffset())
    }
}