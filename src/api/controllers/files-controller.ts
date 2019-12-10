import {boundClass} from "autobind-decorator";
import {NextFunction, Request, Response, Router} from "express";
import {unwrapDdsApiResponse} from "../../dds-api";
import {
    CreateLocalFileRecordDto,
    ExtendFileStorageDurationDto,
    PaginationDto,
    UploadChunkDto,
    UploadFileDto
} from "../dto";
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
        this.router.get("/files", this.findAllFiles);
        this.router.post("/files", validationMiddleware(UploadFileDto), this.uploadData);
        this.router.get("/files/:fileId", this.downloadFile);
        this.router.patch("/files/:fileId", validationMiddleware(ExtendFileStorageDurationDto), this.extendStorageDuration);
        this.router.get("/files/:fileId/info", this.getFileInfo);
        this.router.post("/files/local", validationMiddleware(CreateLocalFileRecordDto), this.createLocalFileRecord);
        this.router.post("/files/local/:localFileId/chunk", validationMiddleware(UploadChunkDto), this.loadLocalFileChunk);
        this.router.post("/files/local/:localFileId/to-dds", this.uploadLocalFileToDds);
        this.router.get("/files/local/:localFileId/is-fully-uploaded", this.checkIfFileUploadedToDds);
        this.router.delete("/files/local/:localFileId", this.deleteLocalFile);
    }

    public async findAllFiles(request: Request, response: Response, next: NextFunction) {
        const pageParameter: string | undefined = request.query.page;
        const sizeParameter: string | undefined = request.query.size;

        const paginationRequest: PaginationDto = {page: 1, size: 1000};

        if (pageParameter !== undefined && !isNaN(Number(pageParameter))) {
            paginationRequest.page = Number(pageParameter);
        }

        if (sizeParameter !== undefined && !isNaN(Number(sizeParameter))) {
            paginationRequest.size = Number(sizeParameter);
        }

        this.filesService.findAllFiles(paginationRequest)
            .then(result => response.json(result))
            .catch(error => next(error));
    }
    
    public async uploadData(request: Request, response: Response, next: NextFunction) {
        const uploadFileDto: UploadFileDto = request.body;
        this.filesService.uploadData(uploadFileDto)
            .then(result => response.json({id: result.data.id, ...unwrapDdsApiResponse(result)}))
            .catch(error => next(error));
    }

    public async downloadFile(request: Request, response: Response, next: NextFunction) {
        const {fileId} = request.params;
        this.filesService.getFile(fileId, response)
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
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async createLocalFileRecord(request: Request, response: Response, next: NextFunction) {
        this.filesService.createLocalFileRecord(request.body)
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async loadLocalFileChunk(request: Request, response: Response, next: NextFunction) {
        const localFileId = request.params.localFileId;

        this.filesService.writeFileChunk(localFileId, request.body)
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async uploadLocalFileToDds(request: Request, response: Response, next: NextFunction) {
        const localFileId = request.params.localFileId;

        this.filesService.uploadLocalFileToDds(localFileId)
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async checkIfFileUploadedToDds(request: Request, response: Response, next: NextFunction) {
        const {localFileId} = request.params;

        this.filesService.checkIfLocalFileFullyUploadedToDds(localFileId)
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async deleteLocalFile(request: Request, response: Response, next: NextFunction) {
        const {localFileId} = request.params;

        this.filesService.deleteLocalFileRecord(localFileId)
            .then(() => {
                response.status(204);
                response.send();
            })
            .catch(error => next(error));
    }

    public getRouter(): Router {
        return this.router;
    }
}
