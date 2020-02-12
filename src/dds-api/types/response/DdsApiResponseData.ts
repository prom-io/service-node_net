import {DdsApiType} from "../DdsApiType";

export interface DdsApiResponseData<AttributesType> {
    type: DdsApiType,
    id: string,
    links: {
        self: string
    },
    attributes: AttributesType
}
