import {boundClass} from "autobind-decorator";
import {AxiosError} from "axios";
import {NextFunction, Request, Response, Router} from "express";
import {DdsApiClient, unwrapDdsApiResponse} from "../../dds-api";
import {UploadFileDto} from "../dto";
import {ExtendFileStorageDurationDto} from "../dto/ExtendFileStorageDurationDto";
import {DdsErrorException} from "../exceptions/DdsErrorException";
import {FileNotFoundException} from "../exceptions/FileNotFoundException";
import {validationMiddleware} from "../middlewares";
import {convertDdsError} from "./convert-dds-error";
import {IAppController} from "./IAppController";

@boundClass
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
        this.router.patch("/files/:fileId", validationMiddleware(ExtendFileStorageDurationDto), this.extendStorageDuration);
        this.router.get("/files/:fileId/info", this.getFileInfo);
    }
    
    public async uploadData(request: Request, response: Response, next: NextFunction) {
        const uploadFileDto: UploadFileDto = request.body;
        this.ddsApiClient.uploadFile({
            additional: uploadFileDto.additional,
            data: uploadFileDto.data,
            duration: uploadFileDto.duration,
            name: uploadFileDto.name
        })
            .then(({data}) => {
                response.json({id: data.data.id, ...unwrapDdsApiResponse(data)});
            })
            .catch((error: AxiosError) => {
                next(new DdsErrorException(convertDdsError(error)));
            });
    }

    public async extendStorageDuration(request: Request, response: Response, next: NextFunction) {
        const fileId: string = request.params.fileId;
        const extendStorageDurationDto: ExtendFileStorageDurationDto = request.body;
        this.ddsApiClient.extendFileStorageDuration(fileId, {
            additional: extendStorageDurationDto.additional,
            duration: extendStorageDurationDto.duration
        })
            .then(({data}) => response.json({id: data.data.id, ...unwrapDdsApiResponse(data)}))
            .catch((error: AxiosError) => {
                next(new DdsErrorException(convertDdsError(error)));
            });
    }

    public async getFileInfo(request: Request, response: Response, next: NextFunction) {
        const fileId = request.params.fileId;

        this.ddsApiClient.getFileInfo(fileId)
            .then(({data}) => {
                response.json({id: data.data.id, ...unwrapDdsApiResponse(data)});
            })
            .catch((error: AxiosError) => {
                if (error.response && error.response.status === 404) {
                    next(new FileNotFoundException(`Could not find file with id ${fileId}`));
                } else {
                    next(new DdsErrorException(convertDdsError(error)));
                }
            });
    }

    public getRouter(): Router {
        return this.router;
    }
}
