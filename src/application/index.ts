import path from "path";
import winston from "winston";
import params from "../params";

export default class App {
    private logger: winston.Logger;
    private baseDir: string;
    private storageDir: string;
    private modules: Map<string, any>;

    public constructor(baseDir: string, logger: winston.Logger) {
        this.logger = logger;
        this.baseDir = baseDir;
        this.modules = new Map<string, Object>();
        this.storageDir = path.join(this.baseDir, "/storage");
    }

    public getStorageDir() {
        return this.storageDir;
    }

    public getBaseDir() {
        return this.baseDir;
    }

    public setLogger(logger: winston.Logger) {
        this.logger = logger;
    }

    public getLogger(): winston.Logger {
        return this.logger;
    }

    public addModule(name: string, module: any) {
        this.modules.set(name, module);
    }

    public getModule(name: string): any|undefined {
        return this.modules.get(name);
    }

    public bootstrap() {
        params.Bootstrap.forEach((fn) => fn(this).bootstrap());
    }

    public run() {

    }
}
