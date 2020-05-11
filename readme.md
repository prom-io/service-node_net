# ServiceNode-Net 

## Table of contents

- [Description](#description)
- [License](#license)
- [How it works](#how-it-works)
- [How to run](#how-to-run)
    - [Prerequisites](#prerequisites)
    - [Build and run process](#build-and-run-process)
        - [Running inside Docker](#running-inside-docker)
        - [Running outside Docker](#running-outside-docker)
        - [Running unit tests](#running-unit-tests)
        - [Environmental variables](#environmental-variables)
- [Current Stage of project](#current-stage-of-project)

## Description

Service node is an application which will act as an intermediate layer between Data Validators and Data marts in Stoa: Data Exchange Platform within Prometeus ecosystem. Service node uses modified ethereum protocol under the hood. It will store encrypted data in a distributed data storage, and metadata in ethereum blockchain. 

Bootstrap node stores information about connected nodes 
in a distributed hash table (DHT).

Service node will expose API for uploading data, which 
is used by data validator. It also 
exposes API for purchasing data, which will be used by data mart. 
You can find a diagram which describes uploading data 
[here](https://github.com/Prometeus-Network/prometeus/blob/master/docs/diagrams/Data%20upload%20(1).png), 
and a diagram describing data purchasing process 
[here](https://github.com/Prometeus-Network/prometeus/blob/master/docs/diagrams/DataMart%20(2).png)


## License

Prometeus Network is licensed under the Apache software license (see LICENSE [file](https://github.com/Prometeus-Network/prometeus/blob/master/LICENSE)). Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either \express or implied.

Prometeus Network makes no representation or guarantee that this software (including any third-party libraries) will perform as intended or will be free of errors, bugs or faulty code. The software may fail which could completely or partially limit functionality or compromise computer systems. If you use or implement it, you do so at your own risk. In no event will Prometeus Network be liable to any party for any damages whatsoever, even if it had been advised of the possibility of damage.

As such this codebase should be treated as experimental and does not contain all currently developed features. Prometeus Network will be delivering regular updates.


## How it works

Upon starting, service node performs the following steps:
- Distributed data storage node initialization (read [more](https://github.com/Prometeus-Network/dds) about the storage system, 
currently based on the [fork](https://github.com/filecoin-project/lotus) of FileCoin project);
- Local database initialization. Service node stores application data 
in local [Nedb](https://github.com/louischatriot/nedb) database;
- P2P-connection establishment. If Service node is started as bootstrap node,
it connects to other bootstrap nodes using [LibP2P](https://github.com/libp2p/js-libp2p);
- Self-registration. If started not as bootstrap node, Service node makes request
to one of the pre-configured bootstrap-nodes to register itself so that other nodes 
can make requests to it.


## How to run

### Prerequisites

In order to run a service node, you need to install:
- Docker. You can find installation instructions on 
[official website](https://docs.docker.com/install/).
- Docker-compose, which can be found 
[here](https://docs.docker.com/compose/install/).
- If you want to run service-node outside of docker container, 
you will need NodeJS and Yarn installed. 
You can find NodeJS installations 
instruction [on the official website](https://nodejs.org/en/download/).
Yarn installation instruction is also available on
[Yarn's official website](https://legacy.yarnpkg.com/en/docs/install/#debian-stable).
- Create and configure `bootstrap-nodes.json` file if you don't want to use default bootstrap nodes. This file contains 
information about bootstrap nodes which help to discover other nodes in network. Below is the content of default `bootstrap-nodes.json` file:
```
{
  "bootstrapNodes": [
    {
      "ipAddress": "188.166.37.102",
      "port": 2000,
      "libp2pAddress": "/ip4/188.166.37.102/tcp/12345/p2p/QmekndSMXKCGLFXp4peHpf9ynLWno6QFbo1uqMq8HBPqtz"
    },
    {
      "ipAddress": "134.209.95.239",
      "port": 2000,
      "libp2pAddress": "/ip4/134.209.95.239/tcp/12346/p2p/QmaF43H5yth1nGWBF4xYEkqaL7X4uUsGNr3vhFbsAWnje6"
    }
  ]
}
```

### Build and run process

Firstly, you need to clone service-node from repository:

````
git clone https://github.com/Prometeus-Network/service-node_net.git
````

After that you need to configure environmental variables in `.env` file. 
They are described [Below](#environmental-variables)

#### Running inside Docker

To run Service node inside Docker, execute the following command:

````
docker-compose up --build
````

Or

````
docker-compose up --build -d
````

If you want to start application in detached mode.

#### Running outside Docker

If you want to run service node outside docker container, you will need to perform next steps:
- Run `yarn global add @nestjs/cli` to install NestJS CLI which is required to run the application
- Run `yarn install`. 
This will install dependencies required for Service node;
- Run `yarn run start`. This command will compile and run the application;

#### Running unit tests

To run unit tests, do the following:
- Run `yarn install` to install all required dependencies 
if they are not installed yet;
- Run `yarn run test`.

### Environmental variables

|            Variable             |                                                                   Description                                                                                                                                                                            |                               Required                              | Default value   |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|-----------------|
| `IS_BOOTSTRAP_NODE`             | Indicates whether this Service node should be started as bootstrap node                                                                                                                                                                                  | No                                                                  | `false`         |
| `BOOTSTRAP_NODE_PORT`           | Port which will be used by LibP2P for P2P communication if Service node started as bootstrap node                                                                                                                                                        | Required if service node is started as bootstrap node               | `undefined`     |
| `BOOTSTRAP_NODE_PEER_ID`        | Pre-defined peer ID which will be used by LibP2P                                                                                                                                                                                                         | Required if you want to run bootstrap node with pre-defined peer ID | `undefined`     |
|`BOOTSTRAP_NODE_PUBLIC_KEY`      | Pre-defined public key which will be used by LibP2P                                                                                                                                                                                                      | Required if you want to run bootstrap node with pre-defined peer ID | `undefined`     |
| `BOOTSTRAP_NODE_PRIVATE_KEY`    | Pre-defined private key which will be used by LibP2P                                                                                                                                                                                                     | Required if you want to run bootstrap node with pre-defined peer ID | `undefined`     |
| `USE_LOCAL_IP_FOR_REGISTRATION` | Defines whether local IP address should be used for self-registration. This may be useful for development purposes or if your bootstrap nodes are located in your local network                                                                          | No                                                                  | `false`         |
| `SERVICE_NODE_API_PORT`         | Port which will be used by Service node API                                                                                                                                                                                                              | Yes                                                                 |                 |
| `DDS_API_BASE_URL`              | Base URL of Distributed Data Storage API                                                                                                                                                                                                                 | Yes                                                                 |                 |
| `BILLING_API_BASE_URL`          | Base URL of Billing API                                                                                                                                                                                                                                  | Yes                                                                 |                 |
| `TEMPORARY_FILES_DIRECTORY`     | Directory for storing temporary files. Please make sure that the application has read and write access to this directory                                                                                                                                 | Yes                                                                 |                 |
| `DDS_STUB_FILES_DIRECTORY`      | Currently this variable is unused. It was used as path for storing files when DDS was unavailable. It will be completely removed in the future                                                                                                           | No                                                                  | `undefined`     |
| `NEDB_DIRECTORY`                | Path to directory which is used by Nedb to store local database                                                                                                                                                                                          | Yes                                                                 |                 |
| `LOGGING_LEVEL`                 | Level of logging verbosity. Allowed values are `debug`, `info`, `warning`, `error`                                                                                                                                                                       | Yes                                                                 |                 |

## Current Stage of project

On the current stage of development, service node has got the following:
- Ethereum smart contracts;
- API for uploading the data to the distributed data storage (used by Data Validator);
- API for purchasing the data (used by Data Mart).
