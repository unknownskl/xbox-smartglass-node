import Crypto from '../src/lib/Crypto'
import { expect } from 'chai'

describe('Crypto', () => {

    it('Should not generate random iv without a secret', () => {
        const sgCrypto = new Crypto()
        const rand_iv = sgCrypto.getIv()

        expect(rand_iv.length).equal(0)
    })

    it('Should return the correct crypto context from secret', () => {
        const sgCrypto = new Crypto()
        sgCrypto.loadSecret('0123456789012345678901234567890123456789012345678901234567890123')

        expect(sgCrypto._secret).to.deep.equal(Buffer.from('0123456789012345678901234567890123456789012345678901234567890123'))
        expect(sgCrypto._encryptionkey).to.deep.equal(Buffer.from('0123456789012345'))
        expect(sgCrypto._hash_key).to.deep.equal(Buffer.from('23456789012345678901234567890123'))
        expect(sgCrypto._iv).to.deep.equal(Buffer.from('6789012345678901'))
    })

    it('Should encrypt data correctly', () => {
        const sgCrypto = new Crypto()
        sgCrypto.loadSecret('0123456789012345678901234567890123456789012345678901234567890123')

        const encrypted = sgCrypto.encrypt(Buffer.from('Test String\x00\x00\x00\x00\x00'), sgCrypto.getIv())

        expect(sgCrypto._iv).to.deep.equal(Buffer.from('6789012345678901'))
        expect(encrypted).to.deep.equal(Buffer.from('0a558e2b483d9c4ccc24296c9ac8a85d', 'hex'))
    })

    it('Should decrypt data correctly', () => {
        const sgCrypto = new Crypto()
        sgCrypto.loadSecret('0123456789012345678901234567890123456789012345678901234567890123')

        const decrypted = sgCrypto.decrypt(Buffer.from('0a558e2b483d9c4ccc24296c9ac8a85d', 'hex'), sgCrypto.getIv())

        expect(sgCrypto._iv).to.deep.equal(Buffer.from('6789012345678901'), sgCrypto.getIv())
        expect(decrypted).to.deep.equal(Buffer.from('Test String\x00\x00\x00\x00\x00'))
    })

    it('Should encrypt data correctly with an iv', () => {
        const sgCrypto = new Crypto()
        sgCrypto.loadSecret('0123456789012345678901234567890123456789012345678901234567890123')
        const key = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex')

        const encrypted = sgCrypto.encrypt(Buffer.from('Test String\x00\x00\x00\x00\x00'), key, sgCrypto.getIv())

        expect(sgCrypto._iv).to.deep.equal(Buffer.from('6789012345678901'))
        expect(encrypted).to.deep.equal(Buffer.from('ac641fbc44858dbb6869dfeca062f05c', 'hex'))
    })

    it('Should decrypt data correctly with an iv', () => {
        const sgCrypto = new Crypto()
        sgCrypto.loadSecret('0123456789012345678901234567890123456789012345678901234567890123')
        const key = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex')

        const decrypted = sgCrypto.decrypt(Buffer.from('ac641fbc44858dbb6869dfeca062f05c', 'hex'), key, sgCrypto.getIv())

        expect(sgCrypto._iv).to.deep.equal(Buffer.from('6789012345678901'), sgCrypto.getIv())
        expect(decrypted).to.deep.equal(Buffer.from('Test String\x00\x00\x00\x00\x00'))
    })


})