import {Module, Global} from "@nestjs/common";
import DataStore from "nedb";
import path from "path";
import {config} from "../config";

@Global()
@Module({
    providers: [
        {
            provide: DataStore,
            useValue: new DataStore({
                autoload: true,
                filename: path.join(config.NEDB_DIRECTORY, "data.db")
            })
        }
    ],
    exports: [DataStore]
})
export class NedbModule {}
