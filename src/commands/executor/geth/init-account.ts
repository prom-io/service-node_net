import {ChildProcess, spawn } from "child_process";
import { promises, writeFile } from "fs";
import DataStore from "nedb";
import { join } from "path";
import { promisify } from "util";
import Base from "./base";

export default class AccountInitial extends Base {

    public run<T>(): Promise<T> {
        return new Promise<T>( async (resolve, reject) => {
            try {
                const res: boolean = await this.checkIsInitialized();
                if ( res ) {
                    resolve();
                    return;
                }
                await this.createAccount();
                await this.initial();
                resolve();
            } catch ( e ) {
                this.app.getLogger().error(e);
                reject();
            }
        } );
    }

    private async getOrCreatePasswdFile() {
        const password = process.env.ACCOUNT_PASSWORD || "secret";
        let file: string;
        await promises.writeFile(
            file = join(this.app.getStorageDir(), "passwd.key"),
            password,
        );
        return file;
    }

    private async createAccount() {
        const command = this.getExecutable();
        const file: string = await this.getOrCreatePasswdFile();
        const args: string[] = [
            "--datadir",
            this.args.get("--datadir")!.toString(),
            "--nousb",
            "account",
            "new",
            "--password",
            file,
        ];
        return new Promise( (resolve, reject) => {
            const childProcess: ChildProcess = spawn(command, args, {
                stdio: ["ignore", process.stdout, process.stderr],
            });
            childProcess.on("close", (code: number, signal: string) => {
                resolve();
            });
        });
    }

    private async initial() {
        const store: DataStore = this.app.getModule("db").getStore();
        await promisify<any>(store.insert).call(store, { AccountIsInitialized : true });
    }

    private async checkIsInitialized(): Promise<boolean> {
        const store: DataStore = this.app.getModule("db").getStore();
        const findOne = promisify(store.findOne).bind(store);
        return !!( await findOne( { AccountIsInitialized : true } ) );
    }

}
