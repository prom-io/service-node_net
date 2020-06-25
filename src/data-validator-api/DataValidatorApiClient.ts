import axios, {AxiosPromise} from "axios";
import {stringify} from "querystring";
import {GetFileKeyRequest} from "./types/request";
import {FileKey} from "../purchase/types/response";

export class DataValidatorApiClient {
    constructor(private readonly scheme: string,
                private readonly ipAddress: string,
                private readonly port: number) {
    }

    public async checkIfNodeHasFile(fileId: string): Promise<boolean> {
        try {
            await axios.get(`${this.scheme}://${this.ipAddress}:${this.port}/api/v3/files/${fileId}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    public getFileKey(fileId: string, getFileKeyRequest: GetFileKeyRequest): AxiosPromise<FileKey> {
        const queryString = stringify({...getFileKeyRequest});

        return axios.get(`${this.scheme}://${this.ipAddress}:${this.port}/api/v3/files/${fileId}/key?${queryString}`);
    }
}
