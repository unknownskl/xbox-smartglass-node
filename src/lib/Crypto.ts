import crypto from 'crypto'
import elliptic from 'elliptic'

export default class Crypto {

    _secret:Buffer

    _iv:Buffer
    _hash_key:Buffer
    _encryptionkey:Buffer
  
    constructor() {
        this._secret = Buffer.from('')
        this._iv = Buffer.from('')
        this._hash_key = Buffer.from('')
        this._encryptionkey = Buffer.from('')
    }

    getIv() {
        return this._iv.toString()
    }

    loadSecret(secret) {
        this._secret = Buffer.from(secret)

        if(this._secret.length != 64){
            console.log('WARNING: secret is not 64 bytes!')
        }

        this._encryptionkey = Buffer.from(this._secret.slice(0, 16))
        this._iv = Buffer.from(this._secret.slice(16, 32))
        this._hash_key = Buffer.from(this._secret.slice(32))
    }

    // getEncryptionKey() {
    //     return this._encryptionkey
    // }

    // getSecret() {
    //     return this._secret
    // }

    encrypt(data, key?, iv?) {

        // Pad data if needed
        data = Buffer.from(data)

        if(data.length % 16 > 0){
            const padStart = data.length % 16
            const padTotal = (16-padStart)

            for(let paddingnum = (padStart+1); paddingnum <= 16; paddingnum++){
                const padBuffer = Buffer.from('00', 'hex')
                padBuffer.writeUInt8(padTotal)

                data = Buffer.concat([
                    data,
                    padBuffer,
                ])
            }
        }

        if(iv === undefined){
            iv = Buffer.from('00000000000000000000000000000000', 'hex')
        }

        if(key === undefined){
            key = this._encryptionkey
        }

        const cipher = crypto.createCipheriv('aes-128-cbc', key, iv)
        cipher.setAutoPadding(false)

        let encryptedPayload = cipher.update(data, 'binary', 'binary')
        encryptedPayload += cipher.final('binary')

        return Buffer.from(encryptedPayload, 'binary')
    }

    decrypt(data, key?, iv?) {

        if(iv === undefined){
            iv = Buffer.from('00000000000000000000000000000000', 'hex')
        }

        if(key === undefined){
            key = this._encryptionkey
        }

        data = Buffer.from(data)
        const cipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
        cipher.setAutoPadding(false)

        let decryptedPayload = cipher.update(data, 'binary', 'binary')
        decryptedPayload += cipher.final('binary')

        return Buffer.from(decryptedPayload, 'binary')
    }

    sign(data) {
        const hashHmac = crypto.createHmac('sha256', this._hash_key)
        hashHmac.update(data)
        const protectedPayloadHash = hashHmac.digest()

        return Buffer.from(protectedPayloadHash)
    }

    signPublicKey(public_key) {
        const sha512 = crypto.createHash('sha512')

        // const EC = elliptic.ec
        const ec = new elliptic.ec('p256')

        // Generate keys
        const key1 = ec.genKeyPair()
        const key2 = ec.keyFromPublic(public_key, 'hex')
        //var public_key_client = key2

        const shared1 = key1.derive(key2.getPublic())
        let derived_secret = Buffer.from(shared1.toString(16), 'hex')

        const public_key_client = key1.getPublic('hex')

        const pre_salt = Buffer.from('d637f1aae2f0418c', 'hex')
        const post_salt = Buffer.from('a8f81a574e228ab7', 'hex')
        derived_secret = Buffer.from(pre_salt.toString('hex')+derived_secret.toString('hex')+post_salt.toString('hex'), 'hex')
        // Hash shared secret
        const sha = sha512.update(derived_secret)
        derived_secret = sha.digest()

        return {
            public_key: public_key_client.toString('hex').slice(2),
            secret: derived_secret.toString('hex'),
        }
    }
}