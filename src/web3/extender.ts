import Web3 from "web3";

export const admin = (web3: Web3) =>  web3.extend(
    {
        property: "admin",
        methods: [{
            name: "peers",
            call: "admin_peers",
        }, {
            name: "nodeInfo",
            call: "admin_nodeInfo",
        },
        ],
    },
);
