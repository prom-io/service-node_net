import {Module} from "@nestjs/common";
import {AccountController} from "./AccountController";
import {AccountService} from "./AccountService";
import {AccountRepository} from "./AccountRepository";
import {InitialAccountRegistrationHandler} from "./InitialAccountRegistrationHandler";
import {Web3Module} from "../web3";

@Module({
    controllers: [AccountController],
    providers: [AccountService, AccountRepository, InitialAccountRegistrationHandler],
    exports: [AccountService],
    imports: [Web3Module]
})
export class AccountModule {}
