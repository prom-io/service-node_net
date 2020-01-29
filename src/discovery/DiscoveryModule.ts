import {Module} from "@nestjs/common";
import {ScheduleModule} from "nest-schedule";
import TCP from "libp2p-tcp";
import Mplex from "libp2p-mplex";
import Secio from "libp2p-secio";
import Bootstrap from "libp2p-bootstrap";
import Gossipsub from "libp2p-gossipsub";
import {create} from "libp2p";
import {BootstrapNodesContainer} from "./BootstrapNodesContainer";
import {DiscoveryController} from "./DiscoveryController";
import {DiscoveryService} from "./DiscoveryService";
import {config} from "../config";
import {AccountModule} from "../account";

@Module({
    controllers: [DiscoveryController],
    providers: [
        BootstrapNodesContainer,
        DiscoveryService,
        {
            provide: "libp2pNode",
            useFactory: async (defaultBootstrapNodesContainer: BootstrapNodesContainer) => {
                if (config.IS_BOOTSTRAP_NODE) {
                    const bootstrapNodesAvailable = defaultBootstrapNodesContainer.getBootstrapNodes()
                        && defaultBootstrapNodesContainer.getBootstrapNodesLibp2pAddresses().length;
                    const peerDiscoveryConfig = bootstrapNodesAvailable
                        ? {
                            enabled: true,
                            autoDial: true,
                            bootstrap: {
                                interval: 5000,
                                enabled: true,
                                list: defaultBootstrapNodesContainer.getBootstrapNodesLibp2pAddresses()
                            }
                        }
                        : {
                            enabled: true,
                            autoDial: true
                        };

                    const libp2pOptions = {
                        modules: {
                            transport: [TCP],
                            streamMuxer: [Mplex],
                            connEncryption: [Secio],
                            peerDiscovery: bootstrapNodesAvailable ? [Bootstrap] : undefined,
                            pubsub: Gossipsub
                        },
                        config: {
                            peerDiscovery: {
                                ...peerDiscoveryConfig
                            }
                        }
                    };
                    return await create(libp2pOptions);
                } else {
                    return null;
                }
            },
            inject: [BootstrapNodesContainer]
        }
    ],
    imports: [ScheduleModule.register(), AccountModule]
})
export class DiscoveryModule {}
