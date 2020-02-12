import {BillingTransactionResponse} from "../billing-api/types/response";
import {TransactionResponse} from "./types/response";

export const billingTransactionResponseToTransactionResponse = (billingTransactionResponse: BillingTransactionResponse): TransactionResponse => ({
    id: billingTransactionResponse.id,
    dataMart: billingTransactionResponse.dataMart,
    dataValidator: billingTransactionResponse.dataValidator,
    type: billingTransactionResponse.txType,
    dataOwner: billingTransactionResponse.dataOwner,
    value: Number(billingTransactionResponse.value),
    created_at: billingTransactionResponse.created_at,
    hash: billingTransactionResponse.hash,
    queueNumber: billingTransactionResponse.queueNumber,
    blockNumber: billingTransactionResponse.blockNumber,
    serviceNode: billingTransactionResponse.serviceNode,
    status: billingTransactionResponse.status
});
