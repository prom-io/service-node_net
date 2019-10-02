import Axios, {AxiosError, AxiosInstance} from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import {assert, expect} from "chai";
import {instance, mock} from "ts-mockito";
import App from "../../src/application";
import {
    DdsApiClient,
    DdsApiResponse,
    DdsApiType,
    ExtendFileStorageRequest,
    ExtendFileStorageResponse,
    NotifyPaymentStatusRequest,
    NotifyPaymentStatusResponse,
    UploadFileRequest,
    UploadFileResponse,
    wrapDdsApiRequest
} from "../../src/dds-api";

describe("DdsApiClient tests", () => {
    let ddsApiClient: DdsApiClient;
    let axiosInstance: AxiosInstance;
    let mockAxios: AxiosMockAdapter;

    beforeEach(() => {
        axiosInstance = Axios.create({
            baseURL: "http://localhost:8080"
        });
        mockAxios = new AxiosMockAdapter(axiosInstance);
        const app = mock(App);
        const appInstance = instance(app);

        ddsApiClient = new DdsApiClient(appInstance, "http://localhost:8080", axiosInstance);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    describe("DdsApiClient.uploadFile()", () => {
        const uploadFileRequest: UploadFileRequest = {
            additional: new Map<string, string>(),
            data: "File data",
            duration: 226600,
            name: "data.txt"
        };

        it("Makes request to DDS API and resolves response if it returns 402 status", async () => {
            const ddsApiResponse: DdsApiResponse<UploadFileResponse> = {
                data: {
                    attributes: {
                        additional: new Map<string, string>(),
                        duration: 226600,
                        name: "data.txt",
                        price: 100
                    },
                    id: "123",
                    links: {
                        self: ""
                    },
                    type: DdsApiType.FILE,
                }
            };

            mockAxios.onPost('/files', wrapDdsApiRequest(uploadFileRequest, DdsApiType.FILE))
                .reply(402, {
                    ...ddsApiResponse
                });

            const response = await ddsApiClient.uploadFile(uploadFileRequest);

            assert(JSON.stringify(response.data) === JSON.stringify(ddsApiResponse));
        });

        it("Rejects and forwards error from DDS API if it has returned non-402 status", done => {
            mockAxios.onPost('/files', wrapDdsApiRequest(uploadFileRequest, DdsApiType.FILE))
                .reply(500, {
                    message: "Error occurred"
                });

            ddsApiClient.uploadFile(uploadFileRequest)
                .catch((error: AxiosError) => {
                    expect(error.response!.status).to.be.equal(500);
                    expect(error.response!.data.message).to.be.equal("Error occurred");
                    done();
                });

        });
    });

    describe("DdsApiClient.extendFileStorageDuration()", () => {
        const extendFileStorageRequest: ExtendFileStorageRequest = {
            additional: new Map<string, string>(),
            duration: 22660
        };
        const fileId = "123";

        it("Makes request to DDS API and resolves response if it returns 402 status", async () => {
            const ddsApiResponse: DdsApiResponse<ExtendFileStorageResponse> = {
                data: {
                    attributes: {
                        additional: new Map<string, string>(),
                        duration: 22660,
                        name: "data.txt",
                        price: 200,
                    },
                    id: "123",
                    links: {
                        self: ''
                    },
                    type: DdsApiType.FILE,
                }
            };

            mockAxios.onPatch(`/files/${fileId}`, wrapDdsApiRequest(extendFileStorageRequest, DdsApiType.FILE))
                .reply(402, {
                    ...ddsApiResponse
                });

            const response = await ddsApiClient.extendFileStorageDuration(fileId, extendFileStorageRequest);

            assert(JSON.stringify(response.data) === JSON.stringify(ddsApiResponse));
        });

        it("Rejects and forwards error from DDS API if it has returned non-402 status", done => {
            mockAxios.onPatch(`/files/${fileId}`, wrapDdsApiRequest(extendFileStorageRequest, DdsApiType.FILE))
                .reply(500, {
                    message: "Error occurred"
                });

            ddsApiClient.extendFileStorageDuration("123", extendFileStorageRequest)
                .catch((error: AxiosError) => {
                    expect(error.response!.status).to.be.equal(500);
                    expect(error.response!.data.message).to.be.equal("Error occurred");
                    done();
                });
        })
    });

    describe("DdsApiClient.notifyPaymentStatus()", () => {
        const notifyPaymentsStatusRequest: NotifyPaymentStatusRequest = {
            amount: 100,
            file_id: "123",
            status: "success"
        };

        it("Makes request to DDS API and resolves response from it", async () => {
            const expectedResponse: DdsApiResponse<NotifyPaymentStatusResponse> = {
                data: {
                    attributes: {
                        amount: 100,
                        file_id: "123",
                        status: "success"
                    },
                    id: "payment-id",
                    links: {
                        self: ''
                    },
                    type: DdsApiType.PAYMENT,
                }
            };

            mockAxios.onPost("/payments", wrapDdsApiRequest(notifyPaymentsStatusRequest, DdsApiType.FILE))
                .reply(200, {
                    ...expectedResponse
                });

            const actualResponse = await ddsApiClient.notifyPaymentStatus(notifyPaymentsStatusRequest);

            assert(JSON.stringify(expectedResponse) === JSON.stringify(actualResponse.data));
        });

        it("Rejects and forwards error if response to DDS API resulted in error",  done => {
            mockAxios.onPost("/payments", wrapDdsApiRequest(notifyPaymentsStatusRequest, DdsApiType.FILE))
                .reply(500, {
                    message: "Error occurred"
                });

            ddsApiClient.notifyPaymentStatus(notifyPaymentsStatusRequest)
                .catch((error: AxiosError) => {
                    expect(error.response!.status).to.be.equal(500);
                    expect(error.response!.data.message).to.be.equal("Error occurred");
                    done();
                });
        })
    })
});
