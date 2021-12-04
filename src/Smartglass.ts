import Logger from './Logger'
// import Events from './Events'
import Session from './lib/Session'

import DiscoveryRequest from './packets/simple/DiscoveryRequest'
import DiscoveryResponse from './packets/simple/DiscoveryResponse'

export default class Smartglass {
    _logger:Logger;
    // _events:Events;
    _session

    constructor() {
        this._logger = new Logger('xbox-smartglass-core')
        // this._events = new Events()
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
                    const response = new DiscoveryResponse(message.data)
                    consolesFound.push(response)
                })
    
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

    connect(ip) {
        return new Promise((resolve, reject) => {
            // const session = new Session(this)
            // session.create().then(() => {

            this.discovery(ip).then((response:any) => {
                if(response.length > 0){
                    // console.log(response[0])
                    // Console is responsive. Lets connect..

                    const session = new Session(this)
                    session.create().then(() => {

                        session.connect(ip, response[0].certificate).then((connectresponse) => {
                            this._session = session

                            resolve({
                                response: connectresponse,
                                session: session,
                            })

                        }).catch((error) => {
                            reject(error)
                        })

                    }).catch((error) => {
                        reject(error)
                    })
                } else {
                    reject({error: 'Console not found on ip: ' + ip})
                }

            }).catch((error) => {
                reject(error)
            })

        })
        
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

    addManager(name, manager) {
        return this._session.addManager(name, manager)
    }

    getManager(name) {
        return this._session.getManager(name)
    }
}