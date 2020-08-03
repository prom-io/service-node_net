import {Module} from "@nestjs/common";
import Axios from "axios";
import {FileController} from "./FileController";
import {FileService} from "./FileService";
import {LocalFileRecordRepository} from "./LocalFileRecordRepository";
import {AccountModule} from "../account";
import {DdsApiModule} from "../dds-api";
import {Web3Module} from "../web3";
import {DiscoveryModule} from "../discovery";

@Module({
    controllers: [FileController],
    providers: [
        FileService,
        LocalFileRecordRepository,
        {
            provide: "filesServiceAxiosInstance",
            useValue: Axios.create()
        }
    ],
    imports: [AccountModule, DdsApiModule, Web3Module, DiscoveryModule]
})
export class FileModule {}
