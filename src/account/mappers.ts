import {AccountRole} from "./types/response";
import {BillingAccountRole} from "../billing-api/types/response";

export const billingAccountRoleToAccountRole = (billingAccountRole: BillingAccountRole): AccountRole => {
    switch (billingAccountRole) {
        case BillingAccountRole.DATA_MART:
            return AccountRole.DATA_MART;
        case BillingAccountRole.DATA_OWNER:
            return AccountRole.DATA_OWNER;
        case BillingAccountRole.SERVICE_NODE:
            return AccountRole.SERVICE_NODE;
        case BillingAccountRole.DATA_VALIDATOR:
            return AccountRole.DATA_VALIDATOR;
        default:
            return AccountRole.SERVICE_NODE;
    }
};
