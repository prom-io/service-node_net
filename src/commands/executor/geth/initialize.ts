import { ChildProcess, spawn} from "child_process";
import fs, { WriteStream } from "fs";
import DataStore from "nedb";
import path from "path";
import {promisify} from "util";
import Base from "./base";

const GENESIS = `
{
    "config": {
      "chainId": 123123123456,
      "homesteadBlock": 0,
      "eip155Block": 0,
      "eip158Block": 0
    },
    "difficulty": "0x2",
    "gasLimit": "0x0",
    "alloc": {}
}
`;

export default class Initializer extends Base {

    public async run<T>(): Promise<T> {
        return new Promise<T>(async ( resolve, reject) => {
            try {
                this.app.getLogger().info(`[Geth]:: Check genesis Block`);
                const res: boolean = await this.checkIsInitialized();
                if (res) {
                    this.app.getLogger().info(`[Geth]:: Genesis Block exists`);
                    resolve();
                    return;
                }
                await this.execute();
                await this.setIsInitialized();
                resolve();
            } catch (e) {
                this.app.getLogger().error(e);
                reject(e);
            }
        });
    }

    private async execute() {
        const command = this.getExecutable();
        const genesis = await this.createGenesisJson();
        const args: string[] = [
            "--datadir",
            this.args.get("--datadir")!.toString(),
            "--nousb",
            "init",
            genesis,
        ];
        this.app.getLogger().info(`[Geth]:: INIT genesis block`);
        return new Promise( (resolve, reject) => {
            const childProcess: ChildProcess = spawn(command, args, {stdio: ["ignore", process.stdout, process.stderr]});
            childProcess.on("close", (code: number, signal: string) => {
                resolve();
            });
        });
    }

    private async checkIsInitialized(): Promise<boolean> {
        const store: DataStore = this.app.getModule("db").getStore();
        const findOne = promisify(store.findOne).bind(store);
        return !!( await findOne( { GenesisInitialized: true } ) );
    }

    private async setIsInitialized() {
        const store: DataStore = this.app.getModule("db").getStore();
        const insert = promisify<any>(store.insert).bind(store);
        await insert( { GenesisInitialized: true } );
    }

    private async createGenesisJson() {
        const writer = promisify(fs.writeFile).bind(fs);
        let genesisFile: string;
        await writer(
            genesisFile = path.join( this.app.getStorageDir(), "genesis.json" ),
            GENESIS,
            );
        return genesisFile;
    }

}
