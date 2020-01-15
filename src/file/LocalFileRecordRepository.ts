import {Injectable} from "@nestjs/common";
import DataStore from "nedb";
import {LocalFileRecord} from "./LocalFileRecord";
import {EntityType} from "../nedb/entity";

@Injectable()
export class LocalFileRecordRepository {
    constructor(private readonly dataStore: DataStore) {
    }

    public save(localFileRecord: LocalFileRecord): Promise<LocalFileRecord> {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne<LocalFileRecord>({_id: localFileRecord._id, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                if (document === null) {
                    this.dataStore.insert<LocalFileRecord>(localFileRecord, (error, saved) => resolve(saved));
                } else {
                    this.dataStore.update<LocalFileRecord>(document, localFileRecord, {}, (_) => {
                        resolve(localFileRecord)
                    });
                }
            })
        })
    }

    public findById(id: string): Promise<LocalFileRecord | null > {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne<LocalFileRecord>({_id: id, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                resolve(document);
            })
        })
    }

    public findByDdsId(ddsId: string): Promise<LocalFileRecord | null> {
        return new Promise<LocalFileRecord>(resolve => {
            this.dataStore.findOne<LocalFileRecord>({ddsId, _type: EntityType.LOCAL_FILE_RECORD}, (_, document) => {
                resolve(document);
            })
        })
    }
}
