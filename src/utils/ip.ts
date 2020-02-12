import Axios from "axios";
import ip from "ip";

interface GetIpAddressResponse {
    ip: string
}

export interface GetIpAddressOptions {
    useLocalIpAddress: boolean
}

export const getIpAddress = async (options?: GetIpAddressOptions): Promise<string> => {
    if (!options) {
        options = {
            useLocalIpAddress: true
        }
    }

    if (options.useLocalIpAddress) {
        return ip.address();
    } else {
        const ipAddressResponse: GetIpAddressResponse = (await Axios.get("https://api.ipify.org/?format=json")).data;
        return ipAddressResponse.ip;
    }
};
