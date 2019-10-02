import {Request, Response, Router} from "express";
import {DdsApiClient, unwrapDdsApiResponse} from "../../dds-api";
import {UploadFileDto} from "../dto";
import {validationMiddleware} from "../middlewares";
import {IAppController} from "./IAppController";

export class FilesController implements IAppController {
    private readonly router: Router;
    private ddsApiClient: DdsApiClient;

    public constructor(router: Router, ddsApiClient: DdsApiClient) {
        this.router = router;
        this.ddsApiClient = ddsApiClient;
        this.initializeRoutes();
    }

    public initializeRoutes(): void {
        this.router.post("/files", validationMiddleware(UploadFileDto), this.uploadData);
    }
    
    public async uploadData(request: Request, response: Response) {
        const uploadFileDto: UploadFileDto = request.body;
        const ddsResponse = await this.ddsApiClient.uploadFile({
            additional: uploadFileDto.additional,
            data: uploadFileDto.data,
            duration: uploadFileDto.duration,
            name: uploadFileDto.name
        });
        const fileUploadResponse = unwrapDdsApiResponse(ddsResponse.data);
        response.json({id: ddsResponse.data.data.id, ...fileUploadResponse});
    }

    public getRouter(): Router {
        return this.router;
    }
}
