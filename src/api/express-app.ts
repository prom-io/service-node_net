import {Express, json, Router} from "express";
import App from "../application";
import IBootstrapping from "../common/interfaces/IBootstrap";
import {DdsApiClient} from "../dds-api";
import {FilesController, IAppController} from "./controllers";
import {exceptionHandler} from "./middlewares";

export class ExpressApp implements IBootstrapping {
    private readonly expressPort: number;
    private app: App;
    private express: Express;

    constructor(app: App, express: Express, expressPort: number | undefined) {
        this.app = app;
        this.express = express;
        this.expressPort = expressPort || 3000;
    }

    public bootstrap(): any {
        const logger = this.app.getLogger();
        this.express.use(json({
            limit: 4194304000 // 500 megabytes
        }));
        this.initializeControllers();
        this.express.use(exceptionHandler);
        this.express.listen(this.expressPort, () => {
            logger.info(`[express] Started express app at ${this.expressPort}`);
        });
        return;
    }

    private initializeControllers() {
        const controllers: IAppController[] = [];
        const ddsApiClient = this.app.getModule("dds") as DdsApiClient;

        controllers.push(new FilesController(Router(), ddsApiClient));

        controllers.forEach(controller => {
            this.express.use("/api/v1", controller.getRouter())
        })
    }
}
