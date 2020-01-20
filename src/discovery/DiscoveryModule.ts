import {Module} from "@nestjs/common";
import TCP from "libp2p-tcp";
import Mplex from "libp2p-mplex";
import Secio from "libp2p-secio";
import Bootstrap from "libp2p-bootstrap";
import MulticastDNS from "libp2p-mdns";
import Gossipsub from "libp2p-gossipsub";
import {createLibp2p} from "libp2p";
import {DefaultBootstrapNodesContainer} from "./DefaultBootstrapNodesContainer";
import {DiscoveryController} from "./DiscoveryController";
import {DiscoveryService} from "./DiscoveryService";
import {config} from "../config";

@Module({
    controllers: [DiscoveryController],
    providers: [
        DefaultBootstrapNodesContainer,
        DiscoveryService,
        {
            provide: "libp2pNode",
            useFactory: (defaultBootstrapNodesContainer: DefaultBootstrapNodesContainer) => {
                if (config.IS_BOOTSTRAP_NODE) {
                    const bootstrapNodesAvailable = defaultBootstrapNodesContainer.getBootstrapNodes()
                        && defaultBootstrapNodesContainer.getBootstrapNodesLibp2pAddresses().length;
                    const peerDiscoveryMechanism = bootstrapNodesAvailable ? Bootstrap : MulticastDNS;
                    const peerDiscoveryConfig = bootstrapNodesAvailable
                        ?
                        {
                            bootstrap: {
                                interval: 60e3,
                                enabled: true,
                                list: defaultBootstrapNodesContainer.getBootstrapNodesLibp2pAddresses()
                            }
                        }
                        :
                        {
                            mdns: {
                                interval: 20e3,
                                enabled: true
                            }
                        };

                    const libp2pOptions = {
                        modules: {
                            transport: [
                                TCP
                            ],
                            streamMuxer: [Mplex],
                            connEncryption: [Secio],
                            peerDiscovery: [peerDiscoveryMechanism],
                            pubsub: Gossipsub
                        },
                        config: {
                           peerDiscovery: {
                                ...peerDiscoveryConfig
                            }
                        }
                    };
                    return createLibp2p(libp2pOptions);
                } else {
                    return null;
                }
            },
            inject: [DefaultBootstrapNodesContainer]
        }
    ]
})
export class DiscoveryModule {}
