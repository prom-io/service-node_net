import cors from "cors";
import {Express, json, Router} from "express";
import App from "../application";
import {BillingApiClient} from "../billing-api";
import DB from "../common/DB";
import IBootstrapping from "../common/interfaces/IBootstrap";
import {DdsApiClient} from "../dds-api";
import {
    AccountsController,
    FilesController,
    IAppController,
    PurchasesController,
    TransactionsController
} from "./controllers";
import {exceptionHandler} from "./middlewares";
import {AccountsRepository, DataOwnersOfDataValidatorRepository, FilesRepository} from "./repositories";
import {AccountsService, FilesService, PurchasesService, TransactionsService} from "./services";

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
        this.express.use(cors());
        this.initializeControllers();
        this.express.use(exceptionHandler);
        this.express.listen(this.expressPort, () => {
            logger.info(`[express] Started express app at ${this.expressPort}`);
        });
        return;
    }

    private initializeControllers() {
        const ddsApiClient = this.app.getModule("dds") as DdsApiClient;
        const billingApiClient = this.app.getModule("billing") as BillingApiClient;
        const dataStore = (this.app.getModule("db") as DB).getStore();
        const filesRepository = new FilesRepository(dataStore);

        const accountsService = new AccountsService(
            billingApiClient,
            new AccountsRepository(dataStore),
            new DataOwnersOfDataValidatorRepository(dataStore)
        );
        const filesService = new FilesService(ddsApiClient, billingApiClient, filesRepository, accountsService);
        const purchasesService = new PurchasesService(ddsApiClient, billingApiClient, filesRepository, accountsService);
        const transactionsService = new TransactionsService(billingApiClient);

        const controllers: IAppController[] = [
            new FilesController(Router(), filesService),
            new PurchasesController(Router(), purchasesService),
            new AccountsController(Router(), accountsService),
            new TransactionsController(Router(), transactionsService)
        ];

        controllers.forEach(controller => {
            this.express.use("/api/v1", controller.getRouter())
        })
    }
}
