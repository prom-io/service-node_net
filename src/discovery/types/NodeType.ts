export enum NodeType {
    SERVICE_NODE = "SERVICE_NODE",
    DATA_VALIDATOR_NODE = "DATA_VALIDATOR_NODE",
    DATA_MART_NODE = "DATA_MART_NODE"
}

export const getNodeTypeFromString = (nodeType: string): NodeType => {
    switch (nodeType.toUpperCase().trim()) {
        case "SERVICE_NODE":
            return NodeType.SERVICE_NODE;
        case "DATA_VALIDATOR_NODE":
            return NodeType.DATA_VALIDATOR_NODE;
        case "DATA_MART_NODE":
            return NodeType.DATA_MART_NODE;
        default:
            return NodeType.SERVICE_NODE;
    }
};
