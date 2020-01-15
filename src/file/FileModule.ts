import {Module} from "@nestjs/common";
import {FileController} from "./FileController";
import {FileService} from "./FileService";
import {LocalFileRecordRepository} from "./LocalFileRecordRepository";
import {AccountModule} from "../account";
import {DdsApiModule} from "../dds-api";

@Module({
    controllers: [FileController],
    providers: [FileService, LocalFileRecordRepository],
    imports: [AccountModule, DdsApiModule]
})
export class FileModule {}
