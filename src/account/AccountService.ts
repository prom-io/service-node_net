import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {AxiosError} from "axios";
import {LoggerService} from "nest-logger";
import uuid from "uuid/v4";
import {Account} from "./Account";
import {
    AccountRegistrationStatusResponse,
    AccountRole,
    BalanceOfAccountResponse,
    BalancesOfLocalAccountsResponse,
    DataOwnersOfDataValidatorResponse,
    LocalAccountResponse
} from "./types/response";
import {RegisterAccountDto, WithdrawDto} from "./types/request";
import {BillingApiClient} from "../billing-api";
import {AccountRepository} from "./AccountRepository";
import {EntityType} from "../nedb/entity";
import {AxiosErrorLogger} from "../logging";
import {billingAccountRoleToAccountRole} from "./mappers";
import {BillingAccountRole} from "../billing-api/types/response";

@Injectable()
export class AccountService {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly billingApiClient: BillingApiClient,
        private readonly log: LoggerService,
        private readonly axiosErrorLogger: AxiosErrorLogger
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
            await this.accountRepository.save(nonDefaultAccount);
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

    public async getBalanceOFLambdaWallet(lambdaWallet: string): Promise<BalanceOfAccountResponse> {
        try {
            const {balanceOf: balance} = (await this.billingApiClient.getBalanceOfLambdaWallet(lambdaWallet)).data;
            return {balance};
        } catch (error) {
            this.axiosErrorLogger.logAxiosError(error);
            if (error.response) {
                throw new HttpException(
                    `Could not get balance of lambda wallet, billing API responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            } else {
                throw new HttpException(
                    `Could not get balance of lambda wallet, billing API is unreachable`,
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }
        }
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
            this.axiosErrorLogger.logAxiosError(error);

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
            }

            this.log.error(message);
            this.axiosErrorLogger.logAxiosError(error);

            throw new HttpException(message, responseStatus);
        }
    }

    public async isAccountRegistered(address: string): Promise<AccountRegistrationStatusResponse> {
        try {
            const registrationStatusResponse = (await this.billingApiClient.isAccountRegistered(address)).data;
            let role: AccountRole | undefined;

            if (registrationStatusResponse.is_registered) {
                const accountRoleResponse = (await this.billingApiClient.getAccountRole(address)).data;
                role = billingAccountRoleToAccountRole(accountRoleResponse.role);
            }

            return {
                registered: registrationStatusResponse.is_registered,
                role
            };
        } catch (error) {
            let message = "Unknown error occurred when tried to check account registration status";
            const responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

            if (error.response) {
                if (error.config) {
                    error = error as AxiosError;

                    if (error.response) {
                        message = `Billing API responded with ${error.response.status} status`;
                    } else {
                        message = "Billing API is unreachable";
                    }
                }
            }

            this.log.error(message);
            this.axiosErrorLogger.logAxiosError(error);

            throw new HttpException(message, responseStatus);
        }
    }

    public async withdrawFunds(withdrawDto: WithdrawDto): Promise<void> {
        try {
            await this.billingApiClient.withdrawFunds(withdrawDto);
        } catch (error) {
            if (error.response) {
                this.log.error(`Error occurred when tried to withdraw funds, billing API responded with ${error.response.status} status`);
                console.log(error);
                throw new HttpException(
                    `Billing API responded with ${error.response.status} status`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            } else {
                this.log.error("Billing API in unreachable");
                throw new HttpException(
                    "Billing API is unreachable",
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }
        }
    }

    public async isLambdaWalletRegistered(lambdaWallet: string): Promise<Omit<AccountRegistrationStatusResponse, "role">> {
        const {isRegistered: registered} = (await this.billingApiClient.isLambdaWalletRegistered(lambdaWallet)).data;

        return {registered}
    }

    public async registerAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        if (registerAccountDto.lambdaWallet) {
            try {
                await this.billingApiClient.registerLambdaWallet({
                    ethereumAddress: registerAccountDto.address,
                    lambdaAddress: registerAccountDto.lambdaWallet
                });
            } catch (error) {
                let message = "Unknown error occurred when tried to register account";
                let responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

                if (error.config) {
                    error = error as AxiosError;

                    if (error.response) {
                        if (error.response.data && error.response.data.message === "Lambda wallet is registered!") {
                            message = "Lambda wallet with such address has already been registered";
                            responseStatus = HttpStatus.CONFLICT;
                        } else {
                            message = `Billing API responded with ${error.response.status}`;
                        }
                    } else {
                        message = "Billing API is unreachable";
                    }
                }

                this.log.error(message);
                this.axiosErrorLogger.logAxiosError(error);

                throw new HttpException(message, responseStatus);
            }
        }

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
                    }
                } else {
                    message = "Billing API is unreachable";
                }
            }

            this.log.error(message);
            this.axiosErrorLogger.logAxiosError(error);

            throw new HttpException(message, responseStatus);
        }
    }

    private async registerServiceNodeAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        const accountRegistrationStatus = (await this.billingApiClient.isAccountRegistered(registerAccountDto.address)).data;

        if (accountRegistrationStatus.is_registered) {
            const accountRole = (await this.billingApiClient.getAccountRole(registerAccountDto.address)).data;

            if (accountRole.role !== BillingAccountRole.SERVICE_NODE) {
                throw new HttpException(
                    `Account with address ${registerAccountDto.address} has already been registered and it's not service node`,
                    HttpStatus.CONFLICT
                )
            }

            const account: Account = {
                _type: EntityType.ACCOUNT,
                address: registerAccountDto.address,
                _id: uuid(),
                default: true,
                accountType: "SERVICE_NODE"
            };

            await this.accountRepository.save(account);
        } else {
            await this.billingApiClient.registerServiceNode({owner: registerAccountDto.address});
            await this.accountRepository.save({
                _type: EntityType.ACCOUNT,
                address: registerAccountDto.address,
                accountType: "SERVICE_NODE",
                default: false
            });
        }
    }

    private async registerDataValidatorAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        await this.billingApiClient.registerDataValidator({owner: registerAccountDto.address});
    }

    private async registerDataMartAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        await this.billingApiClient.registerDataMart({owner: registerAccountDto.address});
    }
}
