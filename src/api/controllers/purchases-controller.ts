import {boundClass} from "autobind-decorator";
import {NextFunction, Request, Response, Router} from "express";
import {PurchaseDataDto} from "../dto";
import {validationMiddleware} from "../middlewares";
import {PurchasesService} from "../services";
import {IAppController} from "./IAppController";

@boundClass
export class PurchasesController implements IAppController {
    private readonly router: Router;
    private purchasesService: PurchasesService;

    constructor(router: Router, purchasesService: PurchasesService) {
        this.router = router;
        this.purchasesService = purchasesService;
        this.initializeRoutes();
    }

    public initializeRoutes(): void {
        this.router.post("/purchases", validationMiddleware(PurchaseDataDto), this.purchaseData)
    }

    public async purchaseData(request: Request, response: Response, next: NextFunction) {
        const purchaseDataDto: PurchaseDataDto = request.body;

        this.purchasesService.purchaseData(purchaseDataDto)
            .then(result => response.json(result))
            .catch(error => next(error));
    }

    public getRouter(): Router {
        return this.router;
    }

}
