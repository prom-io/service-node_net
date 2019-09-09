import IBootstrap from './interfaces/IBootstrap'
import DataStore from 'nedb'
import App from '../application'
import path from 'path'

export default class DB implements IBootstrap
{
    private app: App
    private store: DataStore

    constructor(app: App)
    {
        this.app = app

        this.store = new DataStore({
            filename: path.join(this.app.getStorageDir(), 'data.db') ,
            autoload: true
        })
    }

    public getStore(): DataStore
    {
        return this.store
    }

    public bootstrap():any
    {
    }
}