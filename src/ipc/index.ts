import App from '../application'
import { IPC } from 'node-ipc'
import IBootstrapping from '../common/interfaces/IBootstrap';
import params from '../params'
import { Socket } from 'net';
import Rpc from '../rpc'

export default class IPCListener implements IBootstrapping
{
    ipc: any
    app: App

    constructor(app:App) {
        this.app = app
        this.ipc = new IPC()
        this.ipc.config = {...this.ipc.config, ...params.IpcConfig}
    }

    public bootstrap(): any
    {   this.ipc.config.encoding = 'utf8'
        const handler = Rpc(this.app)
        this.ipc.serve(() => {
            this.ipc.server.on('data',async (data:Buffer, socket: Socket) => {
                let r = await handler.handle(data)
                console.log(r)
                this.ipc.server.emit(socket,JSON.stringify(r))
            })
        })
        this.ipc.server.start()
    }

}