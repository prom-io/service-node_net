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
    socketRoot      : IPC_SOCKET_ROOT || process.cwd(),
    id              : IPC_SOCKET_ID || os.hostname(),
    networkHost     : "localhost",
    networkPort     : IPC_SOCKET_PORT ? parseInt(IPC_SOCKET_PORT) : 6565,
    rawBuffer       : true,
    delimiter       : "\f",
    sync            : false,
    silent          : false,
    logInColor      : true,
    logDepth        : 5,
    maxConnections  : 100,
    retry           : 500,
    maxRetries      : false,
    stopRetrying    : false,
    unlink          : true,
    interfaces      : {
        localAddress: false,
        localPort   : false,
        family      : false,
        hints       : false,
        lookup      : false,
    },
};

export default IpcConfig;
