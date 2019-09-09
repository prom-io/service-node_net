import IBootstrap from './../common/interfaces/IBootstrap'
import DB from './../common/DB'
import App from '../application';
import Web3Connector from '../web3'
import GethExecutor from '../commands/executor/geth';

export const Geth = {
    bootnodes: [
        'enode://e7fe6257d7f2b90c0e3ebce39abe585bbc71e7df10625ce210f8304dd88f2efcbb8db902b1d165ff105e0f7c78284461f539b6556ebdca33718268ab3b74f9d7@172.25.0.101:30303'
    ],
    networkId: 0x01F4
}

export const Bootstrap:Array<{(app:App): IBootstrap}> = [
    app => { let db = new DB(app); app.addModule('db',db);  return db; },
    app => { 
        let g = new GethExecutor.GethRunner(app);
        app.addModule('geth', g);
        (new GethExecutor.GethInitializer(app).run<void>())
        .then(() => g.run())
        return g;
    },
    app => { let _w3 = new Web3Connector(app); app.addModule('web3', _w3); return _w3;},
    

]