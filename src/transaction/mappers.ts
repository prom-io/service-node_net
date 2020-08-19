import {TransactionResponse} from "./types/response";
import {BillingTransactionResponse} from "../billing-api/types/response";

export const billingTransactionResponseToTransactionResponse = (billingTransactionResponse: BillingTransactionResponse): TransactionResponse => ({
    id: billingTransactionResponse.fileUuid,
    dataMart: billingTransactionResponse.dataMart,
    dataValidator: billingTransactionResponse.dataValidator,
    type: billingTransactionResponse.txType,
    dataOwner: billingTransactionResponse.dataOwner,
    value: Number(billingTransactionResponse.amount) / (10 ** 6),
    created_at: billingTransactionResponse.createdAt,
    hash: billingTransactionResponse.hash,
    queueNumber: billingTransactionResponse.queueNumber,
    blockNumber: billingTransactionResponse.blockNumber,
    serviceNode: billingTransactionResponse.serviceNode,
    status: billingTransactionResponse.status
});
