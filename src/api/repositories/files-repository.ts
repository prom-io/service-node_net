import DataStore from "nedb";
import {PaginationDto} from "../dto";
import {EntityType, LocalFileRecord} from "../entity";
import {LocalFileNotFoundException} from "../exceptions";

export class FilesRepository {
    private readonly dataStore: DataStore;

    constructor(dataStore: DataStore<any>) {
        this.dataStore = dataStore;
    }

    public save(localFileRecord: LocalFileRecord): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne<LocalFileRecord>({_id: localFileRecord._id, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                if (document === null) {
                    this.dataStore.insert<LocalFileRecord>(localFileRecord, (error, saved) => resolve(saved));
                } else {
                    this.dataStore.update<LocalFileRecord>(document, localFileRecord, {}, (_, numberOfUpdated) => {
                        resolve(localFileRecord)
                    });
                }
            })
        })
    }

    public findById(id: string): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>((resolve, reject) => {
            this.dataStore.findOne({_id: id, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                if (document === null) {
                    reject(new LocalFileNotFoundException(`Could not find local file with id ${id}`));
                } else {
                    resolve(document);
                }
            })
        })
    }

    public findByDdsId(ddsId: string): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne({ddsId, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                resolve(document);
            })
        })
    }

    public findAllNotFailed(paginationRequest: PaginationDto): Promise<LocalFileRecord[]> {
        const limit = paginationRequest.size;
        const offset = (paginationRequest.page - 1) * limit + 1;

        return new Promise<LocalFileRecord[]>(resolve => {
            this.dataStore.find<LocalFileRecord>({
                _type: EntityType.LOCAL_FILE_RECORD,
                uploadedToDds: true,
                failed: false
            })
                .skip(offset)
                .limit(limit)
                .exec((error, documents) => resolve(documents));
        })
    }
}
