import DataStore from "nedb";
import {Account, EntityType} from "../entity";
import {AccountNotFoundException} from "../exceptions";

export class AccountsRepository {
    private dataStore: DataStore;
    
    constructor(dataStore: DataStore) {
        this.dataStore = dataStore;
    }

    public delete(entity: Account): Promise<void> {
        return new Promise<void>(resolve => {
            this.dataStore.remove({_id: entity._id}, () => {
                resolve();
            })
        })
    }

    public findById(id: string): Promise<Account> {
        return new Promise<Account>((resolve, reject) => {
            this.dataStore.findOne<Account>({_type: EntityType.ACCOUNT, _id: id}, (error, document) => {
                if (error) {
                    reject(error)
                } else {
                    if (document === null) {
                        reject(new AccountNotFoundException(`Could not find account with id ${id}`));
                    } else {
                        resolve(document);
                    }
                }
            })
        })
    }

    public save(account: Account): Promise<Account> {
        return new Promise<Account>(resolve => {
            this.dataStore.findOne({_type: EntityType.ACCOUNT, _id: account._id}, (_, document) => {
                if (document === null) {
                    this.dataStore.insert(account, (savingError, saved) => resolve(saved));
                } else {
                    this.dataStore.update(document, account, {}, () => resolve(account));
                }
            })
        })
    }

    public findAll(): Promise<Account[]> {
        return new Promise<Account[]>(resolve => {
            this.dataStore.find<Account>({_type: EntityType.ACCOUNT}, (_, documents) => resolve(documents));
        })
    }

    public findByAddress(address: string): Promise<Account> {
        return new Promise<Account>((resolve, reject) => {
            this.dataStore.findOne<Account>({_type: EntityType.ACCOUNT}, (_, document) => {
                if (document) {
                    resolve(document);
                } else {
                    reject(new AccountNotFoundException(`Could not find account with address ${address}`));
                }
            })
        })
    }
}
