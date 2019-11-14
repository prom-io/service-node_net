import DataStore from "nedb";
import {EntityType, LocalFileRecord} from "../entity";
import {LocalFileNotFoundException} from "../exceptions";

export class FilesRepository {
    private readonly dataStore: DataStore;

    constructor(dataStore: Nedb<any>) {
        this.dataStore = dataStore;
    }

    public save(localFileRecord: LocalFileRecord): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne<LocalFileRecord>({_id: localFileRecord._id}, (_, document) => {
                if (document === null) {
                    this.dataStore.insert<LocalFileRecord>(localFileRecord, (error, saved) => resolve(saved));
                } else {
                    this.dataStore.update<LocalFileRecord>(document, localFileRecord, {}, () => resolve(localFileRecord));
                }
            })
        })
    }

    public findById(id: string): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>((resolve, reject) => {
            this.dataStore.findOne({_id: id, type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                if (document === null) {
                    reject(new LocalFileNotFoundException(`Could not find local file with id ${id}`));
                } else {
                    resolve(document);
                }
            })
        })
    }
}
