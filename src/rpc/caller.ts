import App from "../application";
import * as Codes from "./codes";
import * as Methods from "./methods";
import * as Structs from "./structs";

export default (app: App) => {
    const empty = (id: any) => ({...Structs.EMPTY, ...(id ? {id} : {})});
    const result = (id: any, res: any) => ({...Structs.BASE, ...(id ? {id} : {}), result: res});
    const methodNotExists = (id: any) => Structs.ERROR(Codes.METHOD_NOT_FOUND, "Method not found");

    const methods: any  = Methods.initializeMethods(app);

    return async (buf: Buffer|string) => {
        const rpc = JSON.parse(buf.toString());
        console.log(rpc);
        if (!rpc.method) {
            return empty(rpc.id);
        }
        if ( !methods.hasOwnProperty(rpc.method) ) {
            return methodNotExists(rpc.id);
        }
        const res = await methods[rpc.method].call(null, rpc.params);
        return result(rpc.id, res);
    };

};
