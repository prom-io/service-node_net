import {PayForDataPurchaseRequest} from "../billing-api/types/request";
import {PurchaseDataDto} from "./types/request";

export const purchaseDataDtoToPayForDataPurchaseRequest = (
    purchaseDataDto: PurchaseDataDto,
    serviceNodeAddress: string
): PayForDataPurchaseRequest => ({
    id: purchaseDataDto.fileId,
    data_mart: purchaseDataDto.dataMartAddress,
    data_validator: purchaseDataDto.dataValidatorAddress,
    data_owner: purchaseDataDto.dataOwnerAddress,
    owner: purchaseDataDto.dataOwnerAddress,
    service_node: serviceNodeAddress,
    sum: "" + purchaseDataDto.price
});
