import Logger from './Logger'
import Events from './Events'
import Session from './Session'

import DiscoveryRequest from './packets/simple/DiscoveryRequest'
import DiscoveryResponse from './packets/simple/DiscoveryResponse'

export default class Smartglass {
    _logger:Logger;
    _events:Events;

    constructor() {
        this._logger = new Logger('xbox-smartglass-core')
        this._events = new Events()
    }

    discovery(ip?:string) {
        // New promise, return consoles?
        // Timeout after 2 seconds

        return new Promise((resolve, reject) => {
            
            const session = new Session(this)

            // const socket = new UdpSocket(this)
            session.create().then(() => {
                const request = new DiscoveryRequest({})
                const requestPacket = request.toPacket()

                const consolesFound: Array<DiscoveryResponse> = []

                session.on('_on_discovery_reponse', (message) => {
                    // console.log('_on_discovery_reponse:', message)
                    const response = new DiscoveryResponse(message.data)
                    // console.log(response)
                    consolesFound.push(response)
                })
    
                // console.log('Sending packet:', requestPacket)
                session.send(requestPacket, ip)
    
                setTimeout(() => {
                    session.close()
                    resolve(consolesFound)
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