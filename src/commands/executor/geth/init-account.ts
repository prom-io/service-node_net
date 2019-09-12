import DataStore from "nedb";
import { promisify } from "util";
import Base from "./base";
import { writeFile, promises } from "fs";
import { join } from "path";
import {ChildProcess, spawn } from "child_process";

export default class AccountInitial extends Base {

    public bootstrap(): any {}

    public run<T>(): Promise<T> {
        return new Promise<T>( async (resolve, reject) => {
            try {
                const res: boolean = await this.checkIsInitialized();
                if ( res ) {
                    resolve();
                    return;
                }
                await this.createAccount()
                await this.initial()
                resolve()
            } catch ( e ) {
                this.app.getLogger().error(e);
                reject()
            }
        } );
    }

    private async getOrCreatePasswdFile() {
        const password = process.env.ACCOUNT_PASSWORD || "secret"
        let file: string;
        await promises.writeFile(
            file = join(this.app.getStorageDir(),'passwd.key'),
            password
        )
        return file
    }

    private async createAccount() {
        const command = this.getExecutable();
        let file: string = await this.getOrCreatePasswdFile()
        const args: string[] = [
            "--datadir",
            this.args.get("--datadir")!.toString(),
            "--nousb",
            "account",
            "new",
            "--password",
            file
        ];
        return new Promise( (resolve, reject) => {
            const childProcess: ChildProcess = spawn(command, args, {stdio: ["ignore", process.stdout, process.stderr]});
            childProcess.on("close", (code: number, signal: string) => {
                resolve();
            });
        });
    }

    private async initial() {
        const store: DataStore = this.app.getModule("db").getStore();
        await promisify<any>(store.insert).call(store, { GenesisInitialized: true });
    }

    private async checkIsInitialized(): Promise<boolean> {
        const store: DataStore = this.app.getModule("db").getStore();
        const findOne = promisify(store.findOne).bind(store);
        return !!( await findOne( { AccountIsInitialized : true } ) );
    }

}
