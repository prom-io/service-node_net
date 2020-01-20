import {Module} from "@nestjs/common";
import {StatusCheckController} from "./StatusCheckController";

@Module({
    controllers: [StatusCheckController]
})
export class StatusCheckModule {}
