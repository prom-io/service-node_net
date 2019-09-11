import App from '../application'
import Web3Connector from '../web3'

export const initializeMethods = (app: App) => {
    const getPeers = async () => {
        let web3: Web3Connector = app.getModule('web3')
        return new Promise((r,j) => {
            console.log(web3.admin)
            web3.admin.peers((e:Error|null,peers:string|Buffer) => {
                if (e) {
                    j(e)
                    return;
                }
                r(peers)
            })
        })
    }

    return {
        getPeers
    }
}