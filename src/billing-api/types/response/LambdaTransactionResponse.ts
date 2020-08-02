export interface LambdaTransactionResponse {
    height: string,
    txhash: string,
    raw_log: string,
    logs: [],
    gas_wanted: string,
    gas_used: string,
    tags: [
        {
            key: string,
            value: string
        }
    ],
    tx: {
        type: string,
        value: {
            msg: [
                {
                    type: string,
                    value: {
                        from_address: string,
                        to_address: string,
                        amount: [
                            {
                                denom: string,
                                amount: string
                            }
                        ]
                    }
                }
            ],
            fee: {
                amount: null | string,
                gas: string
            },
            signatures: [
                {
                    pub_key: {
                        type: string,
                        value: string
                    },
                    signature: string
                }
            ],
            memo: string
        }
    },
    timestamp: string
}
