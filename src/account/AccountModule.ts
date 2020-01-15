import {Module} from "@nestjs/common";
import {AccountController} from "./AccountController";
import {AccountService} from "./AccountService";
import {AccountRepository} from "./AccountRepository";

@Module({
    controllers: [AccountController],
    providers: [AccountService, AccountRepository],
    exports: [AccountService]
})
export class AccountModule {}
