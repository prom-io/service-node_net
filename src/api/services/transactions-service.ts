import {AxiosError} from "axios";
import {BillingApiClient} from "../../billing-api";
import {PaginationDto, TransactionDto, TransactionsCountDto} from "../dto";
import {BillingApiErrorException} from "../exceptions";

export class TransactionsService {
    private readonly billingApiClient: BillingApiClient;

    constructor(billingApiClient: BillingApiClient) {
        this.billingApiClient = billingApiClient;
    }

    public countTransactionsByAddress(address: string): Promise<TransactionsCountDto> {
        return new Promise<TransactionsCountDto>((resolve, reject) => {
            this.billingApiClient.getTransactions(address, 0, 1)
                .then(({data}) => resolve({count: Number(data.count)}))
                .catch((error: AxiosError) => {
                    if (error.response) {
                        reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`));
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable"));
                    }
                })
        })
    }

    public getTransactionsOfAddress(address: string, pagination: PaginationDto): Promise<TransactionDto[]> {
        return new Promise<TransactionDto[]>((resolve, reject) => {
            this.billingApiClient.getTransactions(address, pagination.page, pagination.size)
                .then(({data}) => resolve(data.data.map(transaction => ({
                    id: transaction.id,
                    value: Number(transaction.value),
                    dataOwner: transaction.dataOwner,
                    dataMart: transaction.dataMart,
                    dataValidator: transaction.dataValidator,
                    type: transaction.txType,
                    status: transaction.status,
                    hash: transaction.hash,
                    serviceNode: transaction.serviceNode,
                    blockNumber: transaction.blockNumber,
                    queueNumber: transaction.queueNumber
                }))))
                .catch((error: AxiosError) => {
                    console.log(error);
                    if (error.response) {
                        reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`));
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable"));
                    }
                })
        })
    }
}
