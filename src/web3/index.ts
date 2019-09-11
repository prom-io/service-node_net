import Web3 from 'web3'
import {admin} from './extender'
import net from 'net'
import IBootstrap from '../common/interfaces/IBootstrap'
import App from '../application';
import GethExecutor from '../commands/executor/geth'
import { Socket } from 'net';

export default class Web3Connector implements IBootstrap
{
    private app:App
    private web3: Web3
    private adminModule:any

    constructor(app:App)
    {
        this.web3 = new Web3();
        // Object.defineProperty(this, 'admin',{
        //     writable: false,
        //     get: () => this.adminModule
        // })
        this.adminModule = admin(this.web3)
        this.app = app
    }

    get admin() : any {
        return this.adminModule.admin
    }

    public bootstrap():any
    {
        let geth = this.app.getModule('geth')
        geth.on('geth::ipc::connect',(executor:any, sock: Socket) => {
            this.web3.setProvider(new Web3.providers.IpcProvider(geth.getIpcPath(),net))
            // this.adminModule.admin.nodeInfo((e:Error|null,r:any) => console.log(r.enode))
            // this.adminModule.admin.peers((e:Error|null,r:string|Buffer) => {
            //     console.log(e,r)
            // })
        })
    }
}