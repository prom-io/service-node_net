import DataStore from "nedb";
import App from "../application";
import Web3Connector from "../web3";

export const initializeMethods = (app: App) => {
    const getPeers = async () => {
        const web3: Web3Connector = app.getModule("web3");
        return new Promise((r, j) => {
            web3.admin.peers((e: Error|null, peers: string|Buffer) => {
                if (e) {
                    j(e);
                    return;
                }
                r(peers);
            });
        });
    };

    const connect = async () => {
        const db: DataStore = app.getModule("db").getStore();
        const peers: Array<{enode: string}>|any = await getPeers();

    };

    return {
        connect,
        getPeers,
    };
};
