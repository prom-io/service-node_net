import {DdsApiRequest, DdsApiResponse, DdsApiResponseData, DdsApiType} from "./types";

export const wrapDdsApiRequest = <T>(data: T, type: DdsApiType): DdsApiRequest<T> => ({
    attributes: data,
    type
});

export const getDdsApiResponseData = <T>(ddsApiResponse: DdsApiResponse<T>): DdsApiResponseData<T> => ddsApiResponse.data;

export const unwrapDdsApiResponse = <T>(ddsApiResponse: DdsApiResponse<T>): T => ddsApiResponse.data.attributes;
