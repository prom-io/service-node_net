import Axios from "axios";
import ip from "ip";

interface GetIpAddressResponse {
    ip: string
}

export const getIpAddress = async (useLocalIpAddress: boolean | undefined = false): Promise<string> => {
    if (useLocalIpAddress) {
        return ip.address();
    } else {
        const ipAddressResponse: GetIpAddressResponse = (await Axios.get("https://api.ipify.org/?format=json")).data;
        return ipAddressResponse.ip;
    }
};
