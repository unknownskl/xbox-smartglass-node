import Logger from './Logger'
import UdpSocket from './UdpSocket'

import DiscoveryRequest from './packets/simple/DiscoveryRequest'

export default class Smartglass {
    _logger:Logger;

    constructor() {
        this._logger = new Logger('xbox-smartglass-core')
    }

    discovery(ip?:string) {
        // New promise, return consoles?
        // Timeout after 2 seconds

        return new Promise((resolve, reject) => {
            
            const socket = new UdpSocket()
            socket.create().then(() => {            
                const request = new DiscoveryRequest({})
                const requestPacket = request.toPacket()
    
                // console.log('Sending packet:', requestPacket)
                socket.send(requestPacket, ip)
    
                setTimeout(() => {
                    socket.close()
                    resolve([])
                }, 2000)

            }).catch((error) => {
                reject(error)
            })

        })
    }

    connect() {
        // New promise, no return
    }

    getActiveApp() {
        //
    }

    isConnected() {
        //
    }

    powerOn(options) {
        //
    }

    powerOff() {
        //
    }

    disconnect() {
        //
    }

    recordGameDvr() {
        //
    }

    addManager() {
        //
    }

    getManager() {
        //
    }
}