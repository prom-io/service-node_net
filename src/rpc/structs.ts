export const BASE = {
    jsonrpc : 2.0,
};

export const EMPTY = {
    ...BASE,
    result: "",
};

export const ERROR = (code: number, msg: string) => {
    return {
        ...BASE,
        error: {
            code,
            message: msg,
        },
    };
};
