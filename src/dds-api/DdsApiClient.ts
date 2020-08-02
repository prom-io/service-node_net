import {Inject, Injectable} from "@nestjs/common";
import {AxiosError, AxiosInstance, AxiosPromise} from "axios";
import uuid4 from "uuid/v4";
import fileSystem from "fs";
import randomNumber from "random-number";
import {ExtendStorageDurationRequest, NotifyPaymentStatusRequest, UploadFileRequest} from "./types/request";
import {
    DdsApiResponse,
    ExtendFileStorageDurationResponse,
    NotifyPaymentStatusResponse,
    UploadFileResponse
} from "./types/response";
import {wrapDdsApiRequest} from "./utils";
import {DdsApiType} from "./types";

@Injectable()
export class DdsApiClient {
    constructor(@Inject("ddsApiAxiosInstance") private readonly axios: AxiosInstance) {
    }

    public uploadFile(uploadFileRequest: UploadFileRequest): AxiosPromise<DdsApiResponse<UploadFileResponse>> {
        return new Promise((resolve, reject) => {
            const id = uuid4();
            fileSystem.writeFileSync(`${process.env.DDS_STUB_FILES_DIRECTORY}/${id}`, uploadFileRequest.data, {encoding: "base64"});

            resolve({
                status: 200,
                data: {
                    data: {
                        id,
                        attributes: {
                            price: randomNumber({
                                min: 0.0000000069444,
                                max: 0.001
                            }),
                            name: uploadFileRequest.name,
                            additional: uploadFileRequest.additional,
                            duration: uploadFileRequest.duration || 2629743
                        },
                        links: {
                            self: ""
                        },
                        type: DdsApiType.FILE
                    }
                },
                config: {},
                headers: {},
                request: {},
                statusText: "OK"
            })
        })
        /*return new Promise((resolve, reject) => {
            this.axios.post("/files", wrapDdsApiRequest(uploadFileRequest, DdsApiType.FILE))
                .catch((error: AxiosError) => {
                    if (error.response && error.response.status === 402) {
                        resolve(error.response);
                    } else {
                        reject(error);
                    }
                })
        });*/
    }

    public extendFileStorageDuration(
        fileId: string,
        extendStorageDurationRequest: ExtendStorageDurationRequest
    ): AxiosPromise<DdsApiResponse<ExtendFileStorageDurationResponse>> {
        return new Promise((resolve, reject) => {
            resolve({
                status: 200,
                data: {
                    data: {
                        id: fileId,
                        attributes: {
                            price: randomNumber({
                                min: 0.0000000069444,
                                max: 0.001
                            }),
                            name: "",
                            additional: {},
                            duration: extendStorageDurationRequest.duration || 2629743
                        },
                        links: {
                            self: ""
                        },
                        type: DdsApiType.FILE
                    }
                },
                config: {},
                headers: {},
                request: {},
                statusText: "OK"
            })

            /*
            this.axios.patch(`/files/${fileId}`, wrapDdsApiRequest(extendStorageDurationRequest, DdsApiType.FILE))
                .catch((error: AxiosError) => {
                    if (error.response && error.response.status === 402) {
                        resolve(error.response);
                    } else {
                        reject(error);
                    }
                })*/
        })
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
