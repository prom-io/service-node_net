import {Module} from "@nestjs/common";
import {TransactionController} from "./TransactionController";
import {TransactionService} from "./TransactionService";

@Module({
    controllers: [TransactionController],
    providers: [TransactionService]
})
export class TransactionModule {}
