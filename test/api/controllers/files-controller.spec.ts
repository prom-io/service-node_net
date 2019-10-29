import chai, {expect} from "chai";
import {Router} from "express";
import {fake, match} from "sinon";
import sinonChai from "sinon-chai";
import {deepEqual, instance, mock, when} from "ts-mockito";
import {FilesController} from "../../../src/api/controllers";
import {UploadFileDto} from "../../../src/api/dto";
import {FilesService} from "../../../src/api/services";
import {DdsApiResponse, DdsApiType, FileInfo} from "../../../src/dds-api";

chai.use(sinonChai);

// tslint:disable-next-line:no-var-requires
const {mockRequest, mockResponse} = require("mock-req-res");

describe("FileControllerTests", () => {
    describe("FileController.uploadData()", () => {
        it("Receives request and propagates its processing to FilesService, then writes results to response", async () => {
            const filesService = mock(FilesService);
            const filesServiceInstance = instance(filesService);

            const additional = new Map<string, string>();
            additional.set("key", "value");

            const uploadFileDto = new UploadFileDto(
                "2019-11-28T12:40:26.409Z",
                "testFile",
                "data:text/plain;base64,VGVzdCBkYXRh",
                additional,
                "0x469E96B0f675ee5da1B13F4C03D0B0ecc7BCCd44", // just some random address from etherscan.io
                "txt",
                "text/plain",
                9,
                0.001
            );

            const filesServiceResponse: DdsApiResponse<FileInfo> ={
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

            when(filesService.uploadData(deepEqual(uploadFileDto))).thenResolve(filesServiceResponse);

            const expectedResult = {
                id: filesServiceResponse.data.id,
                ...filesServiceResponse.data.attributes
            };

            const request = mockRequest({
                body: uploadFileDto
            });
            const response = mockResponse();

            const filesController = new FilesController(Router(), filesServiceInstance);

            await filesController.uploadData(request, response, fake);

            expect(response.json).to.have.been.calledWith(match(expectedResult));
        });
    })
});
