import {EntityType} from "./EntityType";

export interface IBaseEntity {
    _type: EntityType,
    _id?: string
}
