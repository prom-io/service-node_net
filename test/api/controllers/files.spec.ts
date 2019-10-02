import {AxiosResponse} from "axios";
import chai, {expect} from "chai";
import {Router} from "express";
import {match} from "sinon";
import sinonChai from "sinon-chai";
import {deepEqual, instance, mock, when} from "ts-mockito";
import {FilesController} from "../../../src/api/controllers";
import {UploadFileDto} from "../../../src/api/dto";
import {DdsApiClient, DdsApiResponse, DdsApiType, UploadFileResponse} from "../../../src/dds-api";

chai.use(sinonChai);

// tslint:disable-next-line:no-var-requires
const {mockRequest, mockResponse} = require("mock-req-res");

const mockAxiosResponse = <T>(data: T, status?: number | undefined, statusText?: string | undefined): AxiosResponse<T> => ({
    config: {},
    data,
    headers: null,
    status: status || 200,
    statusText: statusText || "OK",
});

describe("FilesController tests", () => {
    describe("FilesController.uploadData()", () => {
        it("Receives request and makes request to DDS API, then writes returned data to response", done => {
            const ddsApiClient = mock(DdsApiClient);
            const ddsApiClientInstance = instance(ddsApiClient);

            const uploadFileDto: UploadFileDto = new UploadFileDto(
                2000,
                "file.txt",
                "someData",
                new Map<string, string>(),
                "0x9FCaFcca8aec0367abB35fBd161c241f7b79891B",
                100
            );

            const ddsResponse: DdsApiResponse<UploadFileResponse> =  {
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

            when(ddsApiClient.uploadFile(deepEqual({
                additional: uploadFileDto.additional,
                data: uploadFileDto.data,
                duration: uploadFileDto.duration,
                name: uploadFileDto.name,
            }))).thenResolve(mockAxiosResponse(ddsResponse));

            const expectedResult = {
                id: ddsResponse.data.id,
                ...ddsResponse.data.attributes
            };

            const request = mockRequest({
                body: uploadFileDto
            });
            const response = mockResponse();

            const filesController = new FilesController(Router(), ddsApiClientInstance);
            filesController.uploadData(request, response).then(() => {
                expect(response.json).to.have.been.calledWith(match(expectedResult));
                done();
            });
        })
    })
});
