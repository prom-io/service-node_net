import {boundClass} from "autobind-decorator";
import {NextFunction, Request, Response, Router} from "express";
import {TransactionsService} from "../services";
import {getValidPage, getValidPageSize} from "../utils";
import {IAppController} from "./IAppController";

@boundClass
export class TransactionsController implements IAppController {
    private readonly router: Router;
    private readonly transactionsService: TransactionsService;

    constructor(router: Router, transactionsService: TransactionsService) {
        this.router = router;
        this.transactionsService = transactionsService;
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    public initializeRoutes(): void {
        this.router.get("/transactions/:address", this.getTransactionsOfAddress);
        this.router.get("/transactions/:address/count", this.countTransactionsOfAddress);
    }

    public async getTransactionsOfAddress(request: Request, response: Response, next: NextFunction) {
        const {address} = request.params;
        const {page, size} = request.query;

        console.log(page);

        const validPage = getValidPage(page);
        const validPageSize = getValidPageSize(size);

        this.transactionsService.getTransactionsOfAddress(address, {page: validPage, size: validPageSize})
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public async countTransactionsOfAddress(request: Request, response: Response, next: NextFunction) {
        const {address} = request.params;

        this.transactionsService.countTransactionsByAddress(address)
            .then(result => response.json(result))
            .catch(error => next(error));
    }
}
