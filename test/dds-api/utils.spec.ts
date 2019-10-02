import {expect} from "chai";
import {
    DdsApiRequest,
    DdsApiResponse,
    DdsApiResponseData,
    DdsApiType,
    getDdsApiResponseData, unwrapDdsApiResponse,
    UploadFileRequest,
    UploadFileResponse,
    wrapDdsApiRequest
} from "../../src/dds-api";

describe("DDS Api utilities tests", () => {
    describe("getDdsApiResponseData()", () => {
        const ddsApiResponseData: DdsApiResponseData<UploadFileResponse> = {
            attributes: {
                additional: new Map<string, string>(),
                duration: 22660,
                name: "data.txt",
                price: 100
            },
            id: "123",
            links: {
                self: ''
            },
            type: DdsApiType.FILE,
        };

        const ddsApiResponse: DdsApiResponse<UploadFileResponse> = {
            data: ddsApiResponseData
        };

        it("Retrieves data from DDS API response", () => {
            const unwrappedData = getDdsApiResponseData(ddsApiResponse);

            expect(unwrappedData).to.be.deep.equal(ddsApiResponseData);
        })
    });

    describe("wrapDdsApiRequest()", () => {
        const uploadFileRequest: UploadFileRequest = {
            additional: new Map<string, string>(),
            data: "Some data",
            duration: 224660,
            name: "data.txt"
        };

        it("Wraps data for DDS API request", () => {
            const expectedResult: DdsApiRequest<UploadFileRequest> = {
                attributes: uploadFileRequest,
                type: DdsApiType.FILE
            };

            const actualResult = wrapDdsApiRequest(uploadFileRequest, DdsApiType.FILE);

            expect(expectedResult).to.be.deep.equal(actualResult);
        });
    });

    describe("unwrapDdsApiResponse()", () => {
        const ddsApiResponseData: DdsApiResponseData<UploadFileResponse> = {
            attributes: {
                additional: new Map<string, string>(),
                duration: 22660,
                name: "data.txt",
                price: 100
            },
            id: "123",
            links: {
                self: ''
            },
            type: DdsApiType.FILE,
        };

        const ddsApiResponse: DdsApiResponse<UploadFileResponse> = {
            data: ddsApiResponseData
        };

        it("Unwraps DDS API response", () => {
            const expectedResult = ddsApiResponseData.attributes;

            const actualResult = unwrapDdsApiResponse(ddsApiResponse);

            expect(expectedResult).to.be.deep.equal(actualResult);
        })
    })
});
