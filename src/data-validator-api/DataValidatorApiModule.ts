import {Module} from "@nestjs/common";
import {DataValidatorApiClientFactory} from "./DataValidatorApiClientFactory";

@Module({
    providers: [DataValidatorApiClientFactory],
    exports: [DataValidatorApiClientFactory]
})
export class DataValidatorApiModule {

}
