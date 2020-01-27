import {AccountRole} from "./AccountRole";

export interface AccountRegistrationStatusResponse {
    registered: boolean,
    role?: AccountRole
}
