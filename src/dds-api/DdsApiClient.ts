import {Injectable, Inject} from "@nestjs/common";
import {AxiosInstance, AxiosPromise} from "axios";
import {ExtendStorageDurationRequest, NotifyPaymentStatusRequest, UploadFileRequest} from "./types/request";
import {DdsApiResponse, ExtendFileStorageDurationResponse, NotifyPaymentStatusResponse, UploadFileResponse} from "./types/response";
import {wrapDdsApiRequest} from "./utils";
import {DdsApiType} from "./types";

@Injectable()
export class DdsApiClient {
    constructor(@Inject("ddsApiAxiosInstance") private readonly axios: AxiosInstance) {
    }

    public uploadFile(uploadFileRequest: UploadFileRequest): AxiosPromise<DdsApiResponse<UploadFileResponse>> {
        return this.axios.post("/files", uploadFileRequest);
    }

    public extendFileStorageDuration(
        fileId: string,
        extendStorageDurationRequest: ExtendStorageDurationRequest
    ): AxiosPromise<DdsApiResponse<ExtendFileStorageDurationResponse>> {
        return this.axios.patch(`/files/${fileId}`, extendStorageDurationRequest);
    }

    public getFile(fileId: string): AxiosPromise {
        return this.axios.get(`/files/${fileId}`, {
            responseType: "stream"
        });
    }

    public notifyPaymentStatus(notifyPaymentStatusRequest: NotifyPaymentStatusRequest): AxiosPromise<DdsApiResponse<NotifyPaymentStatusResponse>> {
        return this.axios.post("/payments", wrapDdsApiRequest(notifyPaymentStatusRequest, DdsApiType.FILE));
    }
}
