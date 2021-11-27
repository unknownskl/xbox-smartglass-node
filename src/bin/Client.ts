import Smartglass from '../Smartglass'

const sgClient = new Smartglass()
sgClient.connect('192.168.2.9').then((data) => {

    console.log('resolved:', data)
    //
}).catch((error) => {
    //
    console.log('error:', error)
})