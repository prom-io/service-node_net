import DataStore from "nedb";
import {DataOwnersOfDataValidator, EntityType} from "../entity";

export class DataOwnersOfDataValidatorRepository {
    private readonly dataStore: DataStore;

    constructor(dataStore: DataStore) {
        this.dataStore = dataStore;
    }

    public save(dataOwnersOfDataValidator: DataOwnersOfDataValidator): Promise<DataOwnersOfDataValidator> {
        return new Promise<DataOwnersOfDataValidator>(resolve => {
            this.dataStore.findOne({
                _id: dataOwnersOfDataValidator._id,
                _type: EntityType.DATA_OWNERS_OF_DATA_VALIDATOR
            }, (error, document) => {
                if (document === null) {
                    this.dataStore.insert<DataOwnersOfDataValidator>(dataOwnersOfDataValidator, (_, saved) => resolve(saved));
                } else {
                    this.dataStore.update(document, dataOwnersOfDataValidator, {}, () => resolve(dataOwnersOfDataValidator));
                }
            })
        })
    }

    public findByDataValidatorAddress(address: string): Promise<DataOwnersOfDataValidator | null> {
        return new Promise<DataOwnersOfDataValidator | null>(resolve => {
            this.dataStore.findOne<DataOwnersOfDataValidator>({
                _type: EntityType.DATA_OWNERS_OF_DATA_VALIDATOR,
                dataValidatorAddress: address
            }, (_, document) => resolve(document));
        })
    }
}
