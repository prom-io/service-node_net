import App from './../../application'
import IBootstrap from '../../common/interfaces/IBootstrap'
import IExecutor from './IExecutor'
import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess} from 'child_process'
import {Geth} from './../../params'
import { EventEmitter } from 'events';
import net from 'net';

const MAX_CONNECT_ATTEMPTS = 5
const RETRY_WAIT_TIME = 1000

export default class GethExecutor extends EventEmitter implements IExecutor,IBootstrap
{
    private static instance: GethExecutor
    private command: string = 'geth'
    private args: Map<string,string|number>
    private app: App
    private runned: boolean = false
    private ipcPath: string

    private constructor(app:App) {
        super()
        this.ipcPath = process.env.GETH_IPC_PATH || path.join(app.getBaseDir(),'/ipc/geth.ipc')
        this.args = new Map<string,string|number>()
        this.args.set("--datadir",process.env.GETH_DATADIR || path.join(app.getBaseDir(),'/_chaindata'))
        this.args.set("--ipcpath",this.ipcPath)
        this.args.set("--networkid",Geth.networkId)
        
        // Geth.bootnodes.forEach(v => this.args.set("--bootnodes",v))
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

    public bootstrap():any
    {
        this.run()
    }

    public getIpcPath():string
    {
        return this.ipcPath
    }

    public static getInstance(app: App):GethExecutor {
        if (!GethExecutor.instance) {
            GethExecutor.instance = new GethExecutor(app)
        }
        return GethExecutor.instance
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

    public run(): any {
        if (this.runned) {
            this.app.getLogger().info('[Geth]:: Is runned. Rerun is unavailable')
            return;
        }
        this.app.getLogger().info('[Geth]:: Running')
        let file: string = path.join(
            process.env.EXECUTABLE_PATH || path.join( path.dirname(this.app.getBaseDir()),'/bin'), // Search Object files
            this.command // File name to execute
        )
        try {
            fs.accessSync(file, fs.constants.F_OK | fs.constants.X_OK)
            if (fs.statSync(file).mode & 0b0001) {
                this.execute(file)
            }
        } catch(e) {
            this.app.getLogger().error(e)
            throw e
        }
    }

    private execute(file: string) {
        let args: string[] = [];
        this.args.forEach((v,k) => {
            args.push(k);
            if ('' !== v && v !== undefined) {
                    args.push(v.toString());
            }
        })
        let childProcess:ChildProcess = spawn(file, args,{stdio:['ignore',process.stdout,process.stderr,'ipc']})
        let onExit = (code:number, signal:string) => {
            this.runned = false
            let close = process.env.CLOSE_ON_GETH_CLOSE || true
            this.app.getLogger().info(`Geth closed.\nCode: ${code}, Signal: ${signal}`)
            if (close) {
                this.app.getLogger().info(`Close Process with Geth.`)
                process.exit(code)
            }
        }
        childProcess.on('close',(code: number, signal: string) => onExit(code,signal) )
        process.on('SIGINT',(signal) => childProcess.kill(signal))
        process.on('SIGTERM',(signal) => childProcess.kill(signal))
        process.on('exit',(code) => { childProcess.kill() })
        this.runned = true
        this
        .checkIPCConnection(MAX_CONNECT_ATTEMPTS)
        .catch(e => this.app.getLogger().error(e))
    }

    private async checkIPCConnection(attempt:number)
    {
        this.app.getLogger().info(`[Geth]::Check and try connect to Geth IPC. Attempt: ${attempt}`)
        let sock: net.Socket;
        let tryConnect = async () => {
            fs.accessSync(this.ipcPath, fs.constants.F_OK)
            sock = net.createConnection(this.ipcPath, () => {
                sock.once('data', (data) => {
                    data = JSON.parse(data.toString())
                    this.app.getLogger().info('[Geth]::IPC Provider is correct, Connect Success')
                    this.emit('geth::ipc::connect',this,sock)
                    sock.destroy()
                });
                sock.write('{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":67}',(e) => {
                    console.log(arguments)
                })
                
            })
        }

        try{
            await tryConnect()
        } catch(e) {
            if (attempt <= 0) {
                throw new Error(`Cannot connect to IPC Provider. ${e.message}`)
            }
            setTimeout(() => this.checkIPCConnection(--attempt),RETRY_WAIT_TIME);
        }
    }


}