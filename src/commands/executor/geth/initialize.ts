import fs, { WriteStream } from 'fs'
import path from 'path'
import {promisify} from 'util'
import { spawn, ChildProcess} from 'child_process'
import net from 'net';
import Base from './base'
import DataStore  from 'nedb';
import DB from '../../../common/DB';

const GENESIS = `
{
    "config": {
      "chainId": 500,
      "homesteadBlock": 0,
      "eip155Block": 0,
      "eip158Block": 0
    },
    "difficulty": "0x0",
    "gasLimit": "0x0",
    "alloc": {}
}
`;

export default class Initializer extends Base
{
    public bootstrap(): any{}

    public async run<T>(): Promise<T> {
        return new Promise<T>(async ( resolve, reject) => {
            try{
                this.app.getLogger().info(`[Geth]:: Check genesis Block`)
                let res:boolean = await this.checkIsInitialized()
                if (res) {
                    this.app.getLogger().info(`[Geth]:: Genesis Block exists`)
                    resolve();
                    return;
                }
                await this.execute()
                await this.setIsInitialized()
                resolve();
            } catch(e){
                this.app.getLogger().error(e)
                reject(e)
            }
        })
    }

    private async execute()
    {
        let command = this.getExecutable()
        let genesis = await this.createGenesisJson()
        let args: string[] = [
            '--datadir',
            this.args.get('--datadir')!.toString(),
            '--nousb',
            'init',
            genesis
        ]
        this.app.getLogger().info(`[Geth]:: INIT genesis block`)
        return new Promise( (resolve, reject) => {
            let childProcess:ChildProcess = spawn(command, args,{stdio:['ignore',process.stdout,process.stderr]})
            childProcess.on('close',(code: number, signal: string) => {
                resolve()
            })
        });
    }

    private async checkIsInitialized(): Promise<boolean>
    {
        let store:DataStore = this.app.getModule('db').getStore()
        let findOne = promisify(store.findOne).bind(store)
        return !!( await findOne( { GenesisInitialized:true } ) )
    }

    private async setIsInitialized()
    {
        let store:DataStore = this.app.getModule('db').getStore()
        let insert = promisify<any>(store.insert).bind(store)
        await insert( { GenesisInitialized:true } );
    }

    private async createGenesisJson()
    {
        let writer = promisify(fs.writeFile).bind(fs);
        let genesisFile: string
        await writer(
            genesisFile = path.join( this.app.getStorageDir(),'genesis.json' ),
            GENESIS
            )
        return genesisFile
    }

}