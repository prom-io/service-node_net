import App from "../application";
import GethExecutor from "../commands/executor/geth";
import IPCListener from "../ipc";
import Web3Connector from "../web3";
import DB from "./../common/DB";
import IBootstrap from "./../common/interfaces/IBootstrap";

const Bootstrap: Array<(app: App) => IBootstrap> = [
    (app) => { const db = new DB(app); app.addModule("db", db);  return db; },
    (app) => {
        const g = new GethExecutor.GethRunner(app);
        app.addModule("geth", g);
        (new GethExecutor.GethInitializer(app).run<void>())
        .then(() => (new GethExecutor.GethAccountInitial(app)).run<void>())
        .then(() => g.run());
        return g;
    },
    (app) => { const w3 = new Web3Connector(app); app.addModule("web3", w3); return w3; },
    (app) => { const ipc = new IPCListener(app); app.addModule("ipclistener", ipc); return ipc; },
];

export default Bootstrap;
