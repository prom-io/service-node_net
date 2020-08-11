export interface FilePriceAndKeepUntilMap {
    [fileId: string]: {
        keepUntil: string,
        price: number
    }
}
