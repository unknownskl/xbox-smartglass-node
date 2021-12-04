import Smartglass from '../Smartglass'
import SystemInputChannel from '../channels/SystemInput'

const sgClient = new Smartglass()
sgClient.connect('192.168.2.9').then((data) => {

    console.log('connect resolved:', data)

    sgClient.addManager('system_input', new SystemInputChannel())

    setTimeout(() => {
        sgClient.getManager('system_input').sendCommand('nexus').then((button) => {
            console.log('Button result:', button)

            setTimeout(() => {
                sgClient.getManager('system_input').sendCommand('nexus').then((button) => {
                    console.log('Button result 2:', button)
        
                }, (error) => {
                    console.log(error)
                })
            }, 3000)

        }, (error) => {
            console.log(error)
        })
    }, 3000)

    //
}).catch((error) => {
    //
    console.log('error:', error)
})