import {HttpException, HttpStatus, Inject, Injectable} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {AxiosError, AxiosInstance} from "axios";
import queryString from "querystring";
import {PurchaseDataDto} from "./types/request";
import {DataPurchaseResponse, FileKey} from "./types/response";
import {purchaseDataDtoToPayForDataPurchaseRequest} from "./mappers";
import {BillingApiClient} from "../billing-api";
import {AccountService} from "../account";
import {Web3Wrapper} from "../web3";
import {DiscoveryService} from "../discovery";
import {NodeType} from "../discovery/types";
import {NodeResponse} from "../discovery/types/response";

@Injectable()
export class PurchaseService {
    constructor(
        private readonly billingApiClient: BillingApiClient,
        private readonly accountService: AccountService,
        private readonly log: LoggerService,
        private readonly discoveryService: DiscoveryService,
        private readonly web3Wrapper: Web3Wrapper,
        @Inject("purchaseServiceAxiosInstance") private readonly axios: AxiosInstance
    ) {
    }

    public async purchaseData(purchaseDataDto: PurchaseDataDto): Promise<DataPurchaseResponse> {
        this.log.debug(`Starting processing purchase of file ${purchaseDataDto.fileId} by data mart ${purchaseDataDto.dataMartAddress}`);

        if (!this.web3Wrapper.isSignatureValid(purchaseDataDto.dataMartAddress, purchaseDataDto.signature)) {
            throw new HttpException(
                "Invalid signature",
                HttpStatus.FORBIDDEN
            );
        }

        const serviceNodeAddress = (await this.accountService.getDefaultAccount()).address;

        const dataValidatorNodes = await this.discoveryService.getNodesByAddressAndType(
            purchaseDataDto.dataValidatorAddress,
            NodeType.DATA_VALIDATOR_NODE
        );

        if (dataValidatorNodes.length === 0) {
            throw new HttpException(
                `Could not find any data validator node with ${purchaseDataDto.dataValidatorAddress} address`,
                HttpStatus.NOT_FOUND
            )
        }

        let nodePossessingFile: NodeResponse | undefined;

        for (const nodeInstance of dataValidatorNodes) {
            try {
                console.log(this.axios);
                await this.axios.get(`http://${nodeInstance.ipAddress}:${nodeInstance.port}/api/v3/files/${purchaseDataDto.fileId}`);
                nodePossessingFile = nodeInstance;
                break;
            } catch (error) {
                console.log(error);
                this.log.info(`Seems like data validator node with id ${nodeInstance.id} does not posses file with id ${purchaseDataDto.fileId}, trying next one`)
            }
        }

        if (!nodePossessingFile) {
            throw new HttpException(
                `Could not find any data validator node which posseses file with id ${purchaseDataDto.fileId}`,
                HttpStatus.SERVICE_UNAVAILABLE
            )
        }

        return this.billingApiClient.payForDataPurchase(purchaseDataDtoToPayForDataPurchaseRequest(purchaseDataDto, serviceNodeAddress))
            .then(async () => {
                this.log.debug("Transaction has been successfully completed");
                const requestParameters = queryString.stringify({
                    ...purchaseDataDto.signature,
                    address: purchaseDataDto.dataMartAddress
                });
                const fileKey: FileKey = (await this.axios.get(`http://${nodePossessingFile.ipAddress}:${nodePossessingFile.port}/api/v3/files/${purchaseDataDto.fileId}/key?${requestParameters}`)).data;
                return {fileKey};
            })
            .catch((error: AxiosError) => {
                let message = "Billing API is unreachable";
                const responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

                if (error.response) {
                    message = `Billing API responded with ${error.response.status} status when tried to pay for data purchase`;
                }

                this.log.error(message);
                console.log(error);
                throw new HttpException(message, responseStatus);
            })
    }
}
