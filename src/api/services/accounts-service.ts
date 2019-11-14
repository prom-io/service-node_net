import {AxiosError, AxiosPromise} from "axios";
import DataStore from "nedb";
import {BillingApiClient, RegisterAccountRequest} from "../../billing-api";
import {AccountDto, BalanceDto, CreateDataOwnerDto, RegisterAccountDto} from "../dto";
import {Account, DataOwnersOfDataValidator, EntityType} from "../entity";
import {
    AccountNotFoundException,
    AddressIsAlreadyRegisteredException,
    BillingApiErrorException,
    InvalidAccountTypeException
} from "../exceptions";
import {AccountsRepository} from "../repositories";

export class AccountsService {
    private readonly billingApiClient: BillingApiClient;
    private readonly repository: DataStore;
    private readonly accountsRepository: AccountsRepository;


    constructor(billingApiClient: BillingApiClient, repository: DataStore, accountsRepository: AccountsRepository) {
        this.billingApiClient = billingApiClient;
        this.repository = repository;
        this.accountsRepository = accountsRepository;
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
                case "DATA_OWNER":
                    targetMethod = this.billingApiClient.registerDataOwner;
                    break;
                default:
                    reject(new InvalidAccountTypeException(`Invalid account type. Expected one of the [DATA_MART, DATA_VALIDATOR, DATA_OWNER], got ${registerAccountDto.type}`))
            }

            targetMethod = targetMethod!;
            
            targetMethod({
                owner: registerAccountDto.address
            })
                .then(() => {
                    const account: Account = {
                        _type: EntityType.ACCOUNT,
                        accountType: registerAccountDto.type,
                        address: registerAccountDto.address
                    };
                    this.accountsRepository.save(account).then(() => resolve());
                })
                .catch((error: AxiosError) => {
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

    public registerDataValidator(createDataOwnerDto: CreateDataOwnerDto): Promise<DataOwnersOfDataValidator> {
        return new Promise<DataOwnersOfDataValidator>((resolve, reject) => {
            this.billingApiClient.registerDataOwner({owner: createDataOwnerDto.address})
                .then(() => {
                    this.repository.findOne<DataOwnersOfDataValidator>({
                        _type: EntityType.DATA_OWNERS_OF_DATA_VALIDATOR,
                        dataValidatorAddress: createDataOwnerDto.dataValidatorAddress
                    }, (error, document) => {
                        if (document === null) {
                            const dataOwnersOfDataValidator: DataOwnersOfDataValidator = {
                                _type: EntityType.DATA_OWNERS_OF_DATA_VALIDATOR,
                                dataOwners: [createDataOwnerDto.address],
                                dataValidatorAddress: createDataOwnerDto.address
                            };
                            this.repository.insert(dataOwnersOfDataValidator, (savingError, saved) => resolve(saved));
                        } else {
                            document.dataOwners.push(createDataOwnerDto.address);
                            this.repository.update({
                                    _id: document._id,
                                },
                                {
                                    $set: {
                                        dataOwners: document.dataOwners
                                    }
                                });
                            resolve(document);
                        }
                    })
                })
        })
    }

    public findLocalAccounts(): Promise<AccountDto[]> {
        return this.accountsRepository.findAll().then(accounts => accounts.map(account => ({
            type: account.accountType,
            address: account.address
        })));
    }

    public getBalanceOfAccount(accountAddress: string): Promise<BalanceDto> {
        return new Promise<BalanceDto>((resolve, reject) => {
            this.billingApiClient.getBalanceOfAddress(accountAddress)
                .then(({data}) => resolve({
                    ...data,
                    balance: Number(data.balance)
                }))
                .catch((error: AxiosError) => {
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

        /*
        return new Promise<{[address: string]: number}>((resolve, reject) => {
            this.repository.find<Account>({_type: EntityType.ACCOUNT}, async (error, accounts) => {
                try {
                    const result: {[address: string]: number} = {};
                    Promise.all(accounts.map(async account => ({
                        address: account.address,
                        balance: (await this.getBalanceOfAccount(account.address)).balance
                    })))
                        .then(balances => balances.forEach(balance => result[balance.address] = balance.balance))
                        .then(() => resolve(result));
                } catch (billingError) {
                    reject(billingError);
                }
            })
        })*/
    }
}
