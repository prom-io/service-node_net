import IBootstrap from './../common/interfaces/IBootstrap'
import App from '../application';
import Web3Connector from '../web3'
import GethExecutor from '../commands/executor/GethExecutor';

export const Geth = {
    bootnodes: [
        ''
    ],
    networkId: 0x01F4
}

export const Bootstrap:Array<{(app:App): IBootstrap}> = [
    app => { let _g = GethExecutor.getInstance(app); app.addModule('geth', _g); return _g;},
    app => { let _w3 = new Web3Connector(app); app.addModule('web3', _w3); return _w3;}
    

]