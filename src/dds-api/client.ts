import Axios, {AxiosError, AxiosInstance, AxiosPromise} from "axios";
import dateFormat from "dateformat";
import fileSystem from "fs";
import path from "path";
import randomNumber from "random-number";
import uuid4 from "uuid/v4";
import App from "../application";
import IBootstrap from "../common/interfaces/IBootstrap";
import {
    DdsApiResponse,
    DdsApiType,
    ExtendFileStorageRequest,
    ExtendFileStorageResponse,
    FileInfo,
    NotifyPaymentStatusRequest,
    NotifyPaymentStatusResponse,
    PeriodPaymentResponse,
    StorageResponse,
    UploadFileRequest,
    UploadFileResponse
} from "./types";
import {wrapDdsApiRequest} from "./utils";

export class DdsApiClient implements IBootstrap {
    private app: App;
    private axiosInstance: AxiosInstance;
    private ddsApiUrl: string;

    constructor(app: App, ddsApiUrl: string, axiosInstance: AxiosInstance =  Axios.create({
        baseURL: ddsApiUrl,
        maxContentLength: Infinity
    })) {
        this.app = app;
        this.ddsApiUrl = ddsApiUrl;
        this.axiosInstance = axiosInstance;
    }

    public bootstrap(): any {
        return;
    }

    public getDdsApiUrl(): string {
        return this.axiosInstance.getUri();
    }

    public setDdsApiUrl(ddsApiUrl: string): void {
        this.ddsApiUrl = ddsApiUrl;
    }

    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    public setAxiosInstance(axiosInstance: AxiosInstance): void {
        this.axiosInstance = axiosInstance;
    }

    public uploadFile(request: UploadFileRequest): AxiosPromise<DdsApiResponse<UploadFileResponse>> {

        return new Promise((resolve, reject) => {
            const id = uuid4();
            fileSystem.writeFileSync(`${process.env.DDS_STUB_FILES_DIRECTORY}/${id}`, request.data, {encoding: "base64"});

            resolve({
                status: 200,
                data: {
                    data: {
                        id,
                        attributes: {
                            price: randomNumber({
                                min: 0.0000000069444,
                                max: 1
                            }),
                            name: request.name,
                            additional: request.additional,
                            duration: request.duration || 2629743
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
            this.axiosInstance.post("/files", wrapDdsApiRequest(request, DdsApiType.FILE))
                .catch((error: AxiosError) => {
                    if (error.response && error.response.status === 402) {
                        resolve(error.response);
                    } else {
                        reject(error);
                    }
                })*/
        })
    }

    public extendFileStorageDuration(fileId: string, extendFileStorageRequest: ExtendFileStorageRequest): AxiosPromise<DdsApiResponse<ExtendFileStorageResponse>> {

        return new Promise((resolve, reject) => {
            resolve({
                status: 200,
                data: {
                    data: {
                        id: fileId,
                        attributes: {
                            price: randomNumber({
                                min: 0.0000000069444,
                                max: 1
                            }),
                            name: "",
                            additional: {},
                            duration: extendFileStorageRequest.duration || 2629743
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
            this.axiosInstance.patch(`/files/${fileId}`, wrapDdsApiRequest(extendFileStorageRequest, DdsApiType.FILE))
                .catch((error: AxiosError) => {
                    if (error.response && error.response.status === 402) {
                        resolve(error.response);
                    } else {
                        reject(error);
                    }
                })*/
        })
    }

    public notifyPaymentStatus(notifyPaymentStatusRequest: NotifyPaymentStatusRequest): AxiosPromise<DdsApiResponse<NotifyPaymentStatusResponse>> {
        return this.axiosInstance.post("/payments", wrapDdsApiRequest(notifyPaymentStatusRequest, DdsApiType.FILE));
    }

    public getPaymentNeededForPeriod(from: Date, to: Date): AxiosPromise<DdsApiResponse<PeriodPaymentResponse>> {
        const mask = "yyyymmdd";
        return this.axiosInstance.get("/payments/local", {
            params: {
                from: dateFormat(from, mask),
                to: dateFormat(to, mask)
            }
        })
    }

    public getStorageInfo(): AxiosPromise<DdsApiResponse<StorageResponse>> {
        return this.axiosInstance.get("/files/storage")
    }

    public getFileInfo(fileId: string): AxiosPromise<DdsApiResponse<FileInfo>> {
        return this.axiosInstance.get(`/files/${fileId}/info`);
    }

    public getFile(fileId: string): AxiosPromise<any> {
        return this.axiosInstance.get(`/files/${fileId}`, {
            responseType: "stream"
        });
    }
}
