# ServiceNode-Net 

## Table of contents

- [Description](#description)
- [How it works](#how-it-works)
- [How to run](#how-to-run)
    - [Prerequisites](#prerequisites)
    - [Build and run process](#build-and-run-process)
        - [Running inside Docker](#running-inside-docker)
        - [Running outside Docker](#running-outside-docker)
- [Stages of project](#stages-of-project)
    - [What service node can do now](#what-service-node-can-do-now)
    - [What service node will do in the future](#what-service-node-will-do-in-the-future)

## Description

Service node is an application which will act 
as an intermediate layer between data validators, 
data buyers and data marts. Service node uses 
modified ethereum protocol under the hood. 
It will store encrypted data in a distributed data storage, 
and metadata in ethereum blockchain. 

Bootstrap node stores information about connected nodes 
in a distributed hash table (DHT).

Service node will expose API for uploading data, which 
will be used by data validator. It will will also 
expose API for purchasing data, which will be used by data mart. 
You can find a diagram which describes uploading data 
[here](https://github.com/Prometeus-Network/prometeus/blob/master/docs/diagrams/photo_2019-09-03_19-05-59.jpg), 
and a diagram describing data purchasing process 
[here](https://github.com/Prometeus-Network/prometeus/blob/master/docs/diagrams/photo_2019-09-03_19-05-59.jpg)


## How it works

Upon starting, service node performs the following steps:
- Local database initialization. It is used for 
storing application-specific data such as
information about genesis block and account initialization;
- Ethereum network connection. Service node registers 
itself in a private ethereum network by performing 
a call to a boot node. After that, it downloads blockchain 
data from ethereum network to local ethereum node;
- Web3 initialization. Web3 is a javascript library which 
is designated for interacting with ethereum blockchain;
- Web3 IPC initialization. Web3 IPC is used 
for communicating between service node and local ethereum node.


## How to run

### Prerequisites

In order to run a service node, you need to install:
- Golang. You can find it [here](https://golang.org/dl/).
- Docker. You can find installation instructions on 
[official website](https://docs.docker.com/install/).
- Docker-compose, which can be found 
[here](https://docs.docker.com/compose/install/).
- If you want to run service-node outside of docker container, 
you will need NodeJS installed. 
You can find installations instructions [here](https://nodejs.org/en/download/).

### Build and run process

Firstly, you need to clone service-node from repository:

````
git clone https://github.com/Prometeus-Network/service-node_net.git
````

After repository is cloned, perform next commands:

````
git submodule init
git submodule update
````

This will download go-ethereum submodule.

#### Running inside Docker

To run Service node inside Docker, execute the following command:

````
docker-compose up --build
````

#### Running outside Docker

If you want to run service node outside docker container, you will need to perform next steps:
- Execute `build.sh` script. It will build go-ethereum;
- Run `npm install`. 
This will install dependencies required for Service node;
- Run `npm run c`. This command will compile typescript;
- Run `npm run start` to start the application.

## Stages of project

### What service node can do now

On the current stage of development, service node performs 
the following:
- It stores application-specific data in local database;
- It registers itself in a private ethereum network;
 -It runs ethereum local ethereum node and
 connects itself to the blockchain;

### What service node will do in the future

During next stages of development, the 
following functionality will be added to the service node:
- Integration with distributed data storage API;
- Integration with blockchain and smart contracts;
- API for uploading data to the distributed data storage. 
It will be used by data validator;
- API for purchasing data. It will be used by data mart;


