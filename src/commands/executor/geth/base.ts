import App from './../../../application'
import IBootstrap from '../../../common/interfaces/IBootstrap'
import IExecutor from '../../IExecutor'
import path from 'path'
import {Geth as GethParams} from './../../../params'
import { EventEmitter } from 'events';
import fs from 'fs'

export default abstract class Base extends EventEmitter implements IExecutor,IBootstrap
{
    protected command: string = 'geth'
    protected args: Map<string,string|number>
    protected app: App
    protected runned: boolean = false
    protected ipcPath: string

    public constructor(app:App) {
        super()
        this.ipcPath = process.env.GETH_IPC_PATH || path.join(app.getBaseDir(),'/ipc/geth.ipc')
        this.args = new Map<string,string|number>()
        this.args.set("--datadir",process.env.GETH_DATADIR || path.join(app.getBaseDir(),'/_chaindata'))
        this.args.set("--ipcpath",this.ipcPath)
        this.args.set("--port",process.env.GETH_PORT || 30303)
        this.args.set("--nousb",'')
        // this.args.set("--verbosity",5)
        this.args.set("--networkid",GethParams.networkId)
        
        if (GethParams.bootnodes.length > 0)
            GethParams.bootnodes.forEach(v => this.args.set("--bootnodes",v))
        this.args.set("--ipcpath",this.ipcPath)
        let rpc: string|undefined = process.env.GETH_RPC
        if (false !== !!rpc || 'false' !== rpc) {
            this.args.set("--rpc",'')
            this.args.set("--rpcaddr",'localhost')
            this.args.set("--rpcport",process.env.GETH_RPC_PORT || 8545)
            this.args.set("--rpccorsdomain",'*')
            this.args.set("--rpcapi",'web3,admin,db,debug,eth,miner,net,personal,shh,txpool')
        }

        this.app = app
    }

    abstract bootstrap():any
    abstract run<T>():Promise<T>;

    public getIpcPath():string
    {
        return this.ipcPath
    }

    public getExecutable()
    {
        let file: string = path.join(
            process.env.EXECUTABLE_PATH || path.join( this.app.getBaseDir(),'/bin'), // Search Object files
            this.command // File name to execute
        )
        try {
            fs.accessSync(file, fs.constants.F_OK | fs.constants.X_OK)
            return file
        } catch(e) {
            this.app.getLogger().error(e)
            throw e
        }
    }

    public isRunnded()
    {
        return this.runned
    }

    public setCommand(command: string): this {
        throw new Error(`"setCommand" not implemented in "GethExecutor". Because, command is constant`);
    }    
    
    public setArgs(args: Map<string,string>): this {
        for(let [arg,value] of args) {
            this.args.set(arg,value)
        }
        return this
    }
}