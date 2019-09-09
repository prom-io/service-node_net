import fs from 'fs'
import { spawn, ChildProcess} from 'child_process'
import net from 'net';
import Base from './base'

const MAX_CONNECT_ATTEMPTS = 5
const RETRY_WAIT_TIME = 1000

export default class Runner extends Base
{
    public bootstrap():any 
    {}

    public async run<T>(): Promise<T> {
        return new Promise<T>((res, rej) => {
            if (this.runned) {
                this.app.getLogger().info('[Geth]:: Is runned. Rerun is unavailable')
                res();
            }
            this.app.getLogger().info('[Geth]:: Running')
            this.execute( this.getExecutable() )
        })        
    }

    private execute(file: string) {
        
        let args: string[] = [];
        this.args.forEach((v,k) => {
            args.push(k);
            if ('' !== v && v !== undefined) {
                    args.push(v.toString());
            }
        })
        // args.push('--mine','--miner.threads','1')
        console.log(file, args.join(' '))
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