import IPCListener from '../ipc'
import IBootstrap from './../common/interfaces/IBootstrap'
import DB from './../common/DB'
import App from '../application';
import Web3Connector from '../web3'
import GethExecutor from '../commands/executor/geth';


const Bootstrap:Array<{(app:App): IBootstrap}> = [
    app => { let db = new DB(app); app.addModule('db',db);  return db; },
    app => { 
        let g = new GethExecutor.GethRunner(app);
        app.addModule('geth', g);
        (new GethExecutor.GethInitializer(app).run<void>())
        .then(() => g.run())
        return g;
    },
    app => { let _w3 = new Web3Connector(app); app.addModule('web3', _w3); return _w3;},
    app => { let ipc = new IPCListener(app); app.addModule('ipclistener',ipc); return ipc; }
]

export default Bootstrap