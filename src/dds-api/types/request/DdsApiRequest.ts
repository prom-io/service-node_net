import {DdsApiType} from "../DdsApiType";

export interface DdsApiRequest<AttributesType> {
    type: DdsApiType,
    attributes: AttributesType
}
