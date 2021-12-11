import Smartglass from '../Smartglass'

const sgClient = new Smartglass()
sgClient.connect('192.168.2.9').then((data) => {

    console.log('connect resolved:', data)

    setTimeout(() => {
        // sgClient.getManager('system_input').sendCommand('nexus').then((button) => {
        //     console.log('Button result:', button)

        //     setTimeout(() => {
        //         sgClient.getManager('system_input').sendCommand('nexus').then((button) => {
        //             console.log('Button result 2:', button)
        
        //         }, (error) => {
        //             console.log(error)
        //         })
        //     }, 3000)

        // }, (error) => {
        //     console.log(error)
        // })

        sgClient.getManager('tv_remote').sendIrCommand('btn.vol_up').then((button) => {
            console.log(button)
        }, (error) => {
            console.log(error)
        })
    }, 3000)

    //
}).catch((error) => {
    //
    console.log('error:', error)
})

setInterval(() => {
    console.log('isConnected:', sgClient.isConnected())
}, 1000)

sgClient.on('_on_timeout', (response) => {
    console.log('Client timeout:', response)
})