import {Module} from "@nestjs/common";
import {FileController} from "./FileController";
import {FileService} from "./FileService";
import {LocalFileRecordRepository} from "./LocalFileRecordRepository";
import {AccountModule} from "../account";
import {DdsApiModule} from "../dds-api";
import {Web3Module} from "../web3";

@Module({
    controllers: [FileController],
    providers: [FileService, LocalFileRecordRepository],
    imports: [AccountModule, DdsApiModule, Web3Module]
})
export class FileModule {}
