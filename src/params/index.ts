import IBootstrap from './../common/interfaces/IBootstrap'
import DB from './../common/DB'
import App from '../application';
import Web3Connector from '../web3'
import GethExecutor from '../commands/executor/geth';

export const Geth = {
    bootnodes: [
        'enode://b1e3c40bb0ec9680959a77c680276d00b77dd7d0538bec95f652fdac70d0086e39e9ddd29cd16056f43e5347fe2ce9ce2c1670258e3a8c6418ffe7203ba5d517@127.0.0.1:30303'
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