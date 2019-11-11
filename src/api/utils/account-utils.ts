export const isAccountTypeValid = (accountType: string): boolean => {
    return accountType === "DATA_VALIDATOR" || accountType === "DATA_MART" || accountType === "SERVICE_NODE";
};
