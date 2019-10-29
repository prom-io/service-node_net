import {boundClass} from "autobind-decorator";
import {NextFunction, Request, Response, Router} from "express";
import {unwrapDdsApiResponse} from "../../dds-api";
import {ExtendFileStorageDurationDto, UploadFileDto} from "../dto";
import {validationMiddleware} from "../middlewares";
import {FilesService} from "../services";
import {IAppController} from "./IAppController";

@boundClass
export class FilesController implements IAppController {
    private readonly router: Router;
    private filesService: FilesService;

    public constructor(router: Router, filesService: FilesService) {
        this.router = router;
        this.filesService = filesService;
        this.initializeRoutes();
    }

    public initializeRoutes(): void {
        this.router.post("/files", validationMiddleware(UploadFileDto), this.uploadData);
        this.router.patch("/files/:fileId", validationMiddleware(ExtendFileStorageDurationDto), this.extendStorageDuration);
        this.router.get("/files/:fileId/info", this.getFileInfo);
    }
    
    public async uploadData(request: Request, response: Response, next: NextFunction) {
        const uploadFileDto: UploadFileDto = request.body;
        this.filesService.uploadData(uploadFileDto)
            .then(result => response.json({id: result.data.id, ...unwrapDdsApiResponse(result)}))
            .catch(error => next(error));
    }

    public async extendStorageDuration(request: Request, response: Response, next: NextFunction) {
        const fileId: string = request.params.fileId;
        const extendStorageDurationDto: ExtendFileStorageDurationDto = request.body;
        this.filesService.extendStorageDuration(fileId, extendStorageDurationDto)
            .then(result => response.json({id: result.data.id, ...unwrapDdsApiResponse(result)}))
            .catch(error => next(error));
    }

    public async getFileInfo(request: Request, response: Response, next: NextFunction) {
        const fileId = request.params.fileId;

        this.filesService.getFileInfo(fileId)
            .then(result => response.json({id: result.data.id, ...unwrapDdsApiResponse(result)}))
            .catch(error => next(error));
    }

    public getRouter(): Router {
        return this.router;
    }
}
