import os from "os";
/** @see https://github.com/RIAEvangelist/node-ipc */

const {
    IPC_APPSPACE,
    IPC_SOCKET_ROOT,
    IPC_SOCKET_ID,
    IPC_SOCKET_PORT,
} = process.env;

const IpcConfig = {
    appspace        : IPC_APPSPACE || "service_node-net.",
    delimiter       : "\f",
    id              : IPC_SOCKET_ID || os.hostname(),
    interfaces      : {
        family      : false,
        hints       : false,
        localAddress: false,
        localPort   : false,
        lookup      : false
    },
    logDepth        : 5,
    logInColor      : true,
    maxConnections  : 100,
    maxRetries      : false,
    networkHost     : "localhost",
    networkPort     : IPC_SOCKET_PORT ? parseInt(IPC_SOCKET_PORT,10) : 6565,
    rawBuffer       : true,
    retry           : 500,
    silent          : false,
    socketRoot      : IPC_SOCKET_ROOT || process.cwd(),
    stopRetrying    : false,
    sync            : false,
    unlink          : true
};

export default IpcConfig;
