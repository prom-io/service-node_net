import fs from 'fs'
import {promisify} from 'util'
import { spawn, ChildProcess} from 'child_process'
import net from 'net';
import Base from './base'
import DataStore  from 'nedb';
import DB from '../../../common/DB';


export default class Initializer extends Base
{
    public bootstrap(): any{}

    public async run<T>(): Promise<T> {
        return new Promise<T>(async ( resolve, reject) => {
            try{
                let res:boolean = await this.checkIsInitialized()
                if (res) {
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
        return;
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


}