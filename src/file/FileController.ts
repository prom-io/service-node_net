import {Controller, Body, Get, Post, Patch, Param, Res, Delete, HttpCode, HttpStatus, Query} from "@nestjs/common";
import {Response} from "express";
import {FileService} from "./FileService";
import {CreateLocalFileRecordDto, ExtendFileStorageDurationDto, UploadChunkDto} from "./types/request";
import {DdsFileResponse, DdsFileUploadCheckResponse, LocalFileRecordResponse} from "./types/response";
import {getValidPage, getValidPageSize} from "../utils/pagination";

@Controller("api/v1/files")
export class FileController {
    constructor(private readonly fileService: FileService) {
    }

    @Get()
    public async getFiles(
        @Query("page") page?: string | number,
        @Query("size") size?: string | number
    ): Promise<DdsFileResponse[]> {
        const pageParameter = getValidPage(page);
        const pageSizeParameter = getValidPageSize(size);
        return this.fileService.getFiles(pageParameter, pageSizeParameter);
    }

    @Get(":fileId")
    public async getFile(@Param("fileId") fileId: string, @Res() response: Response): Promise<void> {
        this.fileService.getFile(fileId, response);
    }

    @Patch(":fileId")
    public extendFileStorageDuration(
        @Param("fileId") fileId: string,
        @Body() extendFileStorageDurationDto: ExtendFileStorageDurationDto
    ): Promise<{success: boolean}> {
        return this.fileService.extendFileStorageDuration(fileId, extendFileStorageDurationDto);
    }

    @Get(":fileId/info")
    public getFileInfo(@Param("fileId") fileId: string): Promise<DdsFileResponse> {
        return this.fileService.getFileInfo(fileId);
    }

    @Post("local")
    public createLocalFile(@Body() createLocalFileRecordDto: CreateLocalFileRecordDto): Promise<LocalFileRecordResponse> {
        return this.fileService.createLocalFileRecord(createLocalFileRecordDto);
    }

    @Post("local/:localFileId/chunk")
    public async uploadFileChunk(
        @Param("localFileId") localFileId: string,
        @Body() uploadChunkDto: UploadChunkDto
    ): Promise<void> {
        await this.fileService.writeFileChunk(localFileId, uploadChunkDto);
    }

    @Delete("local/:localFileId")
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteLocalFileRecord(@Param("localFileId") localFileId: string): Promise<void> {
        await this.fileService.deleteLocalFileRecord(localFileId);
    }

    @Post("local/:localFileId/to-dds")
    public async uploadLocalFileToDds(@Param("localFileId") localFileId: string): Promise<void> {
        await this.fileService.uploadLocalFileToDds(localFileId);
    }

    @Get("local/:localFileId/is-fully-uploaded")
    public checkLocalFileUploadStatus(@Param("localFileId") localFileId: string): Promise<DdsFileUploadCheckResponse> {
        return this.fileService.checkLocalFileUploadStatus(localFileId);
    }
}
