import DataStore from "nedb";
import path from "path";
import App from "../application";
import IBootstrap from "./interfaces/IBootstrap";

export default class DB implements IBootstrap {
    private app: App;
    private store: DataStore;

    constructor(app: App) {
        this.app = app;

        this.store = new DataStore({
            autoload: true,
            filename: path.join(this.app.getStorageDir(), "data.db")
        });
    }

    public getStore(): DataStore {
        return this.store;
    }

    public bootstrap(): any {
        return;
    }
}
