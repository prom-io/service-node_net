import {boundClass} from "autobind-decorator";
import {NextFunction, Request, Response, Router} from "express";
import {RegisterAccountDto} from "../dto";
import {validationMiddleware} from "../middlewares";
import {AccountsService} from "../services";
import {IAppController} from "./IAppController";

@boundClass
export class AccountsController implements IAppController {
    private readonly router: Router;
    private readonly accountsService: AccountsService;

    constructor(router: Router, accountsService: AccountsService) {
        this.router = router;
        this.accountsService = accountsService;
        this.initializeRoutes();
    }

    public initializeRoutes(): void {
        this.router.post("/accounts", validationMiddleware(RegisterAccountDto), this.registerAccount);
        this.router.get("/accounts", this.findLocalAccounts);
        this.router.get("/accounts/:address/balance", this.getBalanceOfAccount);
    }

    public getRouter(): Router {
        return this.router;
    }

    public async registerAccount(request: Request, response: Response, next: NextFunction) {
        const registerAccountDto: RegisterAccountDto = request.body;

        this.accountsService.registerAccount(registerAccountDto)
            .then(() => response.json({"success": true}))
            .catch(error => next(error))
    }

    public async findLocalAccounts(request: Request, response: Response, next: NextFunction) {
        this.accountsService.findLocalAccounts()
            .then(accounts => response.json(accounts))
            .catch(error => next(error));
    }

    public async getBalanceOfAccount(request: Request, response: Response, next: NextFunction) {
        const {address} = request.params;

        this.accountsService.getBalanceOfAccount(address)
            .then(result => response.json(result))
            .catch(error => next(error));
    }
}