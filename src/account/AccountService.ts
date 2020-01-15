import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {AxiosError} from "axios";
import {LoggerService} from "nest-logger";
import {RegisterAccountDto} from "./types/request";
import {BillingApiClient} from "../billing-api";
import {AccountRepository} from "./AccountRepository";
import {EntityType} from "../nedb/entity";
import {BalanceOfAccountResponse, BalancesOfLocalAccountsResponse, DataOwnersOfDataValidatorResponse, LocalAccountResponse} from "./types/response";

@Injectable()
export class AccountService {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly billingApiClient: BillingApiClient,
        private readonly log: LoggerService
    ) {
    }

    public async getAllLocalAccounts(): Promise<LocalAccountResponse[]> {
        return (await this.accountRepository.findAll())
            .map(account => ({
                address: account.address,
                default: account.default
            }))
    }

    public async getDefaultAccount(): Promise<LocalAccountResponse> {
        const accounts = (await this.accountRepository.findAll()).filter(account => account.accountType === "SERVICE_NODE");

        if (accounts.length === 0) {
            throw new HttpException("No accounts registered on this service node", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        if (accounts.filter(account => account.default).length === 0) {
            return {
                address: accounts[0].address,
                default: true
            };
        } else {
            return accounts.filter(account => account.default)
                .map(account => ({
                    address: account.address,
                    default: account.default
                }))
                .reduce(account => account)
        }
    }

    public async setDefaultAccount(address: string): Promise<void> {
        const account = await this.accountRepository.findByAddress(address);

        if (account.accountType !== "SERVICE_NODE") {
            throw new HttpException(`Account ${address} is not service node`, HttpStatus.BAD_REQUEST);
        }

        let accounts = await this.accountRepository.findAll();

        account.default = true;
        // tslint:disable-next-line:no-shadowed-variable
        accounts = accounts.filter(account => account.address !== address);

        await this.accountRepository.save(account);

        for (const nonDefaultAccount of accounts) {
            nonDefaultAccount.default = false;
            await this.accountRepository.save(account);
        }
    }

    public getBalancesOfLocalAccounts(): Promise<BalancesOfLocalAccountsResponse> {
        return this.accountRepository.findAll().then(accounts => {
            const result: BalancesOfLocalAccountsResponse = {};
            return Promise.all(accounts.map(async account => ({
                address: account.address,
                balance: (await this.getBalanceOfAccount(account.address)).balance
            })))
                .then(balances => {
                    balances.forEach(balance => result[balance.address] = balance.balance);
                    return result;
                })
        })
    }

    public async getBalanceOfAccount(address: string): Promise<BalanceOfAccountResponse> {
        try {
            return {
                balance: Number((await this.billingApiClient.getBalanceOfAddress(address)).data.balance)
            }
        } catch (error) {
            let message = "Billing API is unreachable";
            const responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

            if (error.response) {
                message = `Billing API responded with ${error.response.status} status when tried to get balance of ${address}`;
                console.log(error);
            }

            this.log.error(message);

            throw new HttpException(message, responseStatus);
        }
    }

    public async getDataOwnersOfDataValidator(dataValidatorAddress: string): Promise<DataOwnersOfDataValidatorResponse> {
        try {
            return {
                dataOwners: (await this.billingApiClient.getDataOwnersOfDataValidator(dataValidatorAddress)).data.address
            };
        } catch (error) {
            let message = "Billing API is unreachable";
            const responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

            if (error.response) {
                message = `Billing API responded with ${error.response.status} status when tried to get data owners of data validator`;
                console.log(error);
            }

            this.log.error(message);

            throw new HttpException(message, responseStatus);
        }
    }

    public async registerAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        try {
            if (registerAccountDto.type === "SERVICE_NODE") {
                await this.registerServiceNodeAccount(registerAccountDto);
            } else if (registerAccountDto.type === "DATA_MART") {
                await this.registerDataMartAccount(registerAccountDto);
            } else {
                await this.registerDataValidatorAccount(registerAccountDto);
            }
        } catch (error) {
            let message = "Unknown error occurred when tried to register account";
            let responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

            if (error.config) {
                error = error as AxiosError;

                if (error.response) {
                    if (error.response.status === 400) {
                        message = "Account with such address has already been registered";
                        responseStatus = HttpStatus.CONFLICT;
                    } else {
                        message = `Billing API responded with ${error.response.status}`;
                        this.log.error(message);
                    }
                } else {
                    message = "Billing API is unreachable";
                    this.log.error(message);
                }
            }

            console.log(error);
            throw new HttpException(message, responseStatus);
        }
    }

    private async registerServiceNodeAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        await this.billingApiClient.registerServiceNode({owner: registerAccountDto.address});
        await this.accountRepository.save({
            _type: EntityType.ACCOUNT,
            address: registerAccountDto.address,
            accountType: "SERVICE_NODE",
            default: false
        });
    }

    private async registerDataValidatorAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        await this.billingApiClient.registerDataValidator({owner: registerAccountDto.address});
    }

    private async registerDataMartAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        await this.billingApiClient.registerDataMart({owner: registerAccountDto.address});
    }
}
