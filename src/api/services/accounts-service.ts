import {AxiosError, AxiosPromise} from "axios";
import {BillingApiClient, RegisterAccountRequest} from "../../billing-api";
import {AccountDto, BalanceDto, CreateDataOwnerDto, DataOwnersOfDataValidatorDto, RegisterAccountDto} from "../dto";
import {Account, DataOwnersOfDataValidator, EntityType} from "../entity";
import {
    AddressIsAlreadyRegisteredException,
    BillingApiErrorException,
    InvalidAccountTypeException,
    NoAccountsRegisteredException,
    NotServiceNodeAccountException
} from "../exceptions";
import {AccountsRepository, DataOwnersOfDataValidatorRepository} from "../repositories";
import {accountToAccountDto} from "../utils";

export class AccountsService {
    private readonly billingApiClient: BillingApiClient;
    private readonly accountsRepository: AccountsRepository;
    private readonly dataOwnersOfDataValidatorRepository: DataOwnersOfDataValidatorRepository;

    constructor(billingApiClient: BillingApiClient, accountsRepository: AccountsRepository, dataOwnersOfDataValidatorRepository: DataOwnersOfDataValidatorRepository) {
        this.billingApiClient = billingApiClient;
        this.accountsRepository = accountsRepository;
        this.dataOwnersOfDataValidatorRepository = dataOwnersOfDataValidatorRepository;
    }

    public registerAccount(registerAccountDto: RegisterAccountDto): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let targetMethod: (registerAccountRequest: RegisterAccountRequest) => AxiosPromise<void>;

            switch (registerAccountDto.type.trim().toUpperCase()) {
                case "DATA_VALIDATOR":
                    targetMethod = this.billingApiClient.registerDataValidator;
                    break;
                case "DATA_MART":
                    targetMethod = this.billingApiClient.registerDataMart;
                    break;
                case "SERVICE_NODE":
                    targetMethod = this.billingApiClient.registerServiceNode;
                    break;
                default:
                    reject(new InvalidAccountTypeException(`Invalid account type. Expected one of the [DATA_MART, DATA_VALIDATOR, SERVICE_NODE], got ${registerAccountDto.type}`))
            }

            targetMethod = targetMethod!;
            
            targetMethod({
                owner: registerAccountDto.address
            })
                .then(() => {
                    const account: Account = {
                        _type: EntityType.ACCOUNT,
                        accountType: registerAccountDto.type,
                        address: registerAccountDto.address,
                        default: false
                    };
                    this.accountsRepository.save(account).then(() => resolve());
                })
                .catch((error: AxiosError) => {
                    console.log(error);
                    if (error.response) {
                        if (error.response.status === 400) {
                            reject(new AddressIsAlreadyRegisteredException(`Address ${registerAccountDto.address} has already been registered`))
                        } else {
                            reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`, error.response.status))
                        }
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable", 500))
                    }
                })
        })
    }

    public registerDataOwner(createDataOwnerDto: CreateDataOwnerDto): Promise<DataOwnersOfDataValidatorDto> {
        return new Promise<DataOwnersOfDataValidatorDto>((resolve, reject) => {
            this.billingApiClient.registerDataOwner({
                dataOwner: createDataOwnerDto.address,
                dataValidator: createDataOwnerDto.dataValidatorAddress
            })
                .then(() => {
                    this.dataOwnersOfDataValidatorRepository.findByDataValidatorAddress(createDataOwnerDto.dataValidatorAddress)
                        .then(dataOwnersOfDataValidator => {
                            if (dataOwnersOfDataValidator) {
                                dataOwnersOfDataValidator.dataOwners.push(createDataOwnerDto.address);
                                this.dataOwnersOfDataValidatorRepository.save(dataOwnersOfDataValidator)
                                    .then(saved => resolve({dataOwners: saved.dataOwners}));
                            } else {
                               const newDocument: DataOwnersOfDataValidator = {
                                    _type: EntityType.DATA_OWNERS_OF_DATA_VALIDATOR,
                                    dataOwners: [createDataOwnerDto.address],
                                    dataValidatorAddress: createDataOwnerDto.dataValidatorAddress
                                };
                               this.dataOwnersOfDataValidatorRepository.save(newDocument)
                                   .then(saved => resolve({dataOwners: saved.dataOwners}));
                            }
                        })
                })
                .catch((error: AxiosError) => {
                    console.log(error);
                    if (error.response) {
                        if (error.response.status === 400) {
                            reject(new AddressIsAlreadyRegisteredException(`Address ${createDataOwnerDto.address} has already been registered`))
                        } else {
                            reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`))
                        }
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable"));
                    }
                });
        })
    }

    public findDataOwnersOfDataValidator(dataValidatorAddress: string): Promise<DataOwnersOfDataValidatorDto> {
        return new Promise<DataOwnersOfDataValidatorDto>((resolve, reject) => {
            this.billingApiClient.getDataOwnersOfDataValidator(dataValidatorAddress)
                .then(({data}) => resolve({dataOwners: data.address}))
                .catch((error: AxiosError) => {
                    if (error.response) {
                        reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`));
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable"));
                    }
                })
        })
    }

    public findLocalAccounts(): Promise<AccountDto[]> {
        return this.accountsRepository.findAll().then(accounts => accounts.map(account => accountToAccountDto(account)));
    }

    public getBalanceOfAccount(accountAddress: string): Promise<BalanceDto> {
        return new Promise<BalanceDto>((resolve, reject) => {
            this.billingApiClient.getBalanceOfAddress(accountAddress)
                .then(({data}) => resolve({
                    ...data,
                    balance: Number(data.balance)
                }))
                .catch((error: AxiosError) => {
                    console.log(error);
                    if (error.response) {
                        reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`));
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable."))
                    }
                })
        })
    }

    public getBalanceOfAllAccounts(): Promise<{[address: string]: number}> {
        return this.accountsRepository.findAll().then(accounts => {
            const result: {[address: string]: number} = {};
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

    public async setDefaultAccount(address: string): Promise<void> {
        const account = await this.accountsRepository.findByAddress(address);

        if (account.accountType !== "SERVICE_NODE") {
            throw new NotServiceNodeAccountException(`Account ${address} is not service node`);
        }

        let accounts = await this.accountsRepository.findAll();

        account.default = true;
        accounts = accounts.filter(account => account.address !== address);

        await this.accountsRepository.save(account);

        for (const nonDefaultAccount of accounts) {
            nonDefaultAccount.default = false;
            await this.accountsRepository.save(account);
        }
    }

    public async getDefaultAccount(): Promise<AccountDto> {
        const accounts = (await this.accountsRepository.findAll()).filter(account => account.accountType === "SERVICE_NODE");

        if (accounts.length === 0) {
            throw new NoAccountsRegisteredException("No accounts registered on this service node");
        }

        if (accounts.filter(account => account.default).length === 0) {
            return accountToAccountDto(accounts[0]);
        } else {
            return accounts.filter(account => account.default)
                .map(account => accountToAccountDto(account))
                .reduce(account => account)
        }
    }
}
