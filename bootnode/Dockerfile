FROM ubuntu:xenial

RUN apt-get update && \
    apt-get install -y wget &&\
    rm -rf /var/lib/apt/lists/*

WORKDIR "/opt"

COPY bin ./bin
COPY ./genesis.json ./genesis.json

ENV PASS="123"
ENV bootnodeId=""
ENV bootnodeIp=""
RUN echo $PASS > /opt/passwd && ls -la /opt/ && /opt/bin/geth --datadir /opt/chaindata --nousb init /opt/genesis.json \
    && /opt/bin/geth --datadir /opt/chaindata account new --password /opt/passwd

CMD exec /opt/bin/geth --datadir /opt/chaindata \
    --networkid="123123123456" \
    --rpc --rpcaddr "0.0.0.0" --rpccorsdomain "*" \
    --mine --miner.threads 1 \
    --nousb

EXPOSE 8545
EXPOSE 30303
