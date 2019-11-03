export interface IBaseEntity {
    _type: string,
    _id?: string
}

// tslint:disable-next-line:interface-name
export interface Account extends IBaseEntity{
    address: string,
    accountType: string
}
