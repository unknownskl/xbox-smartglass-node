import Logger from '../src/Logger'
import { expect } from 'chai'

describe('Logger', () => {

    before(function() {
        this.logger = new Logger('tests')
    })

    it('should log using log()', function(){
        this.logger.log('test')
    })

    it('should log using debug()', function(){
        this.logger.debug('test')
    })

    it('should log using info()', function(){
        this.logger.info('test')
    })

    it('should log using warning()', function(){
        this.logger.warning('test')
    })

    it('should log using error()', function(){
        this.logger.error('test')
    })

    it('should create a new logger using extend()', function(){
        this.logger.extend('test2')
    })

    after(function() {
        delete this.logger
    })
})