import {Injectable, OnApplicationBootstrap} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {AccountService} from "./AccountService";
import {RegisterAccountDto} from "./types/request";
import {config} from "../config";
import {Web3Wrapper} from "../web3";

@Injectable()
export class InitialAccountRegistrationHandler implements OnApplicationBootstrap {
    constructor(private readonly accountService: AccountService,
                private readonly web3Wrapper: Web3Wrapper,
                private readonly log: LoggerService) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        this.log.info("Checking if node has initial account");
        if ((await this.accountService.getAllLocalAccounts()).length === 0 && config.INITIAL_ACCOUNT_PRIVATE_KEY) {
            this.log.info("Registering new Service node account");
            const web3Account = this.web3Wrapper.createAccountFromPrivateKey(config.INITIAL_ACCOUNT_PRIVATE_KEY!);
            this.log.info(`Generated address is ${web3Account.address}`);
            const registerAccountDto = new RegisterAccountDto(
                web3Account.address,
                "SERVICE_NODE",
                config.INITIAL_ACCOUNT_PRIVATE_KEY,
                undefined
            );
            await this.accountService.registerAccount(registerAccountDto);
        }
    }
}
