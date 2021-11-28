import Packet from '../../lib/Packet'
import Crypto from '../../lib/Crypto'

export interface ConsoleStatusOptions {
    sequenceNum:number;
    target_id:number;
    source_id:number;
    flags?:number;
    channel_id:Buffer;

    tv_provider?:number;
    major_version?:number;
    minor_version?:number;
    build:number;
    locale:string;
    activeTitles: Array<any>;
}

export default class ConsoleStatus extends Packet {
    _crypto:Crypto

    sequenceNum = 0
    target_id = 0
    source_id = 0
    flags = 40990
    channel_id = Buffer.from('0000000000000000', 'hex')
    protected_payload = ''

    tv_provider = 0
    major_version = 10
    minor_version = 0
    build = 0
    locale = 'en-US'
    activeTitles: Array<any> = []

    constructor(packet:Buffer | ConsoleStatusOptions, crypto:Crypto){
        super('ConsoleStatus')

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

            this.tv_provider = protected_payload.read('uint32')
            this.major_version = protected_payload.read('uint32')
            this.minor_version = protected_payload.read('uint32')
            this.build = protected_payload.read('uint32')
            this.locale = protected_payload.read('sgstring').toString()

            const titleCount = protected_payload.read('uint16')
            for(let i = 0; i < titleCount; i++){
                this.activeTitles.push({
                    title_id: protected_payload.read('uint32'),
                    title_disposition: protected_payload.read('uint16'),
                    product_id: protected_payload.read('bytes', 16),
                    sandbox_id: protected_payload.read('bytes', 16),
                    aum_id: protected_payload.read('sgstring').toString(),
                })
            }

        } else {

            this.sequenceNum = packet.sequenceNum || this.sequenceNum
            this.target_id = packet.target_id || this.target_id
            this.source_id = packet.source_id || this.source_id
            this.flags = packet.flags || this.flags
            this.channel_id = packet.channel_id || this.channel_id

            this.tv_provider = packet.tv_provider || this.tv_provider
            this.major_version = packet.major_version || this.major_version
            this.minor_version = packet.minor_version || this.minor_version
            this.build = packet.build || this.build
            this.locale = packet.locale || this.locale
            this.activeTitles = packet.activeTitles || this.activeTitles

        }
    }

    toPacket() {
        this.setPacket(Buffer.allocUnsafe(2048))

        // Generate protected payload
        const protected_payload_decoded = new Packet('protectedPayload')
        protected_payload_decoded.setPacket(Buffer.allocUnsafe(2048))

        protected_payload_decoded.write('uint32', this.tv_provider)
        protected_payload_decoded.write('uint32', this.major_version)
        protected_payload_decoded.write('uint32', this.minor_version)
        protected_payload_decoded.write('uint32', this.build)
        protected_payload_decoded.write('sgstring', this.locale)

        protected_payload_decoded.write('uint16', this.activeTitles.length)
        for(let i = 0; i < this.activeTitles.length; i++){
            protected_payload_decoded.write('uint32', this.activeTitles[0].title_id)
            protected_payload_decoded.write('uint16', this.activeTitles[0].title_disposition)
            protected_payload_decoded.write('bytes', this.activeTitles[0].product_id)
            protected_payload_decoded.write('bytes', this.activeTitles[0].sandbox_id)
            protected_payload_decoded.write('sgstring', this.activeTitles[0].aum_id)
        }

        const payloadLength = protected_payload_decoded.getOffset()

        // Write packet header
        this.write('bytes', Buffer.from('d00d', 'hex')) // Packet type (ConsoleStatus)
        this.write('uint16', payloadLength) // ProtectedPayloadlength
        // this.write('uint16', 2) // Version = 2

        // Write unprotected payload
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