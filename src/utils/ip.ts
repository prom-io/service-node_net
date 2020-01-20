import Axios from "axios";

interface GetIpAddressResponse {
    ip: string
}

export const getIpAddress = async (): Promise<string> => {
    const ipAddressResponse: GetIpAddressResponse = (await Axios.get("https://api.ipify.org/?format=json")).data;
    return ipAddressResponse.ip;
};
