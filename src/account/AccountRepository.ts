import {Injectable} from "@nestjs/common";
import DataStore from "nedb";
import {Account} from "./Account";
import {EntityType} from "../nedb/entity";
import {LocalAccountResponse} from "./types/response";

@Injectable()
export class AccountRepository {
    constructor(private readonly dataStore: DataStore) {
    }

    public delete(entity: Account): Promise<void> {
        return new Promise<void>(resolve => {
            this.dataStore.remove({_id: entity._id}, () => {
                resolve();
            })
        })
    }

    public findById(id: string): Promise<Account | null> {
        return new Promise<Account>((resolve, reject) => {
            this.dataStore.findOne<Account>({_type: EntityType.ACCOUNT, _id: id}, (error, document) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(document)
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

    public findByAddress(address: string): Promise<Account | null> {
        return new Promise<Account>((resolve, reject) => {
            this.dataStore.findOne<Account>({_type: EntityType.ACCOUNT}, (_, document) => {
                resolve(document);
            })
        })
    }
}
