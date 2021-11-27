import crypto from 'crypto'

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

        if(iv === undefined){
            iv = Buffer.from('00000000000000000000000000000000', 'hex')
        }

        if(key === undefined){
            key = this._encryptionkey
        }

        data = Buffer.from(data)
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
}