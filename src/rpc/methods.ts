import App from "../application";
import RoundRobin from '../common/RoundRobin'
import Web3Connector from "../web3";



export const initializeMethods = (app: App) => {
    const web3: Web3Connector = app.getModule("web3");
    const admin = web3.admin
    const next = RoundRobin(app)

    const getNodeInfo = async () => {
        return new Promise<any>( (r,j) => {
            admin.nodeInfo( (e: Error|null, nodeInfo:any) => {
                if (e) {
                    j(e)
                    return
                }
                r(nodeInfo)
            })
        })
    }
    const getPeers = async () => {
        return new Promise<any[]>( (r,j) => {
            admin.peers((e: Error|null, peers:any[]) => {
                if (e) {
                    j(e)
                    return
                }
                r(peers)
            })
        } )
    };

    const connect = async () => {
        const results = await Promise.all([
            getPeers(),
            getNodeInfo(),
        ])
        // tslint:disable-next-line: one-variable-per-declaration
        const peers: any[] = results[0],
            nodeInfo: any = results[1];
        peers.unshift(nodeInfo)
        const nextIdx = next(peers)
        if (peers[nextIdx] === nodeInfo) {
            return {
                connection: 'estabilished',
                redirect: ''
            }
        }
        return {
            connection: 'redirect',
            redirect: peers[nextIdx].enode
        }
    };

    return {
        connect,
        getPeers,
    };
};
