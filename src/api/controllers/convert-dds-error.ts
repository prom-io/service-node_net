import {AxiosError} from "axios";

export const convertDdsError = (axiosError: AxiosError): string => axiosError.response
    ? `DDS API responded with ${axiosError.response!.status}`
    : `DDS API is unreachable`;
