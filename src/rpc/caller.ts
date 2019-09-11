import * as Methods from './methods'
import App from '../application'
import * as Structs from './structs'
import * as Codes from './codes'

export default (app: App) => {
    const empty = (id:any) => {return {...Structs.EMPTY, ...(id ? {id:id}:{})}}
    const result = (id:any, res: any) => {return {...Structs.BASE, ...(id ? {id:id}:{}), result:res}}
    const methodNotExists = (id:any) => { return Structs.ERROR(Codes.METHOD_NOT_FOUND,"Method not found") }
    
    let methods:any  = Methods.initializeMethods(app)

    return async (buf: Buffer|string) => {
        let rpc = JSON.parse(buf.toString())
        console.log(rpc)
        if (!rpc.method) {
            return empty(rpc.id)
        }
        if ( !methods.hasOwnProperty(rpc.method) ) {
            return methodNotExists(rpc.id);
        }
        let res = await methods[rpc.method].call(null,rpc.params)
        return result(rpc.id, res)
    }

}