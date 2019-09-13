import Web3 from "web3";

export const admin = (web3: Web3) =>  web3.extend(
    {
        
        methods: [{
            call: "admin_peers",
            name: "peers",
        }, {
            call: "admin_nodeInfo",
            name: "nodeInfo",
        },
        ],
        property: "admin",
    },
);
