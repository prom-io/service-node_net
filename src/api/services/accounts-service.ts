import {AxiosError, AxiosPromise} from "axios";
import DataStore from "nedb";
import {BillingApiClient, RegisterAccountRequest} from "../../billing-api";
import {AccountDto, BalanceDto, RegisterAccountDto} from "../dto";
import {Account} from "../entity";
import {
    AccountNotFoundException,
    AddressIsAlreadyRegisteredException,
    BillingApiErrorException,
    InvalidAccountTypeException
} from "../exceptions";

export class AccountsService {
    private readonly billingApiClient: BillingApiClient;
    private readonly repository: DataStore;

    constructor(billingApiClient: BillingApiClient, repository: DataStore) {
        this.billingApiClient = billingApiClient;
        this.repository = repository;
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
                        _type: "account",
                        accountType: registerAccountDto.type,
                        address: registerAccountDto.address
                    };
                    this.repository.insert(account, () => resolve());
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

    public findLocalAccounts(): Promise<AccountDto[]> {
        return new Promise<AccountDto[]>(resolve => {
            this.repository.find<Account>({_type: "account"}, (error, documents) => {
                resolve(documents.map(account => ({
                    type: account.accountType,
                    address: account.address
                })))
            })
        })
    }

    public findAccountByAddressAndType(address: string, type: string): Promise<AccountDto> {
        return new Promise<AccountDto>((resolve, reject) => {
            this.repository.findOne<Account>({_type: "account", address, accountType: type}, (error, document) => {
                if (document) {
                    resolve({
                        address: document.address,
                        type: document.accountType
                    });
                } else {
                    reject(new AccountNotFoundException(`Could not find account with type ${type} and address ${address}`));
                }
            })
        })
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
        return new Promise<{[address: string]: number}>((resolve, reject) => {
            this.repository.find<Account>({_type: "account"}, async (error, accounts) => {
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
        })
    }
}
