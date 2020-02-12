import {DdsApiResponseData} from "./DdsApiResponseData";

export interface DdsApiResponse<AttributesType> {
    data: DdsApiResponseData<AttributesType>
}
