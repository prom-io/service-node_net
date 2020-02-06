import {Module} from "@nestjs/common";
import {ScheduleModule} from "nest-schedule";
import TCP from "libp2p-tcp";
import Mplex from "libp2p-mplex";
import Secio from "libp2p-secio";
import Bootstrap from "libp2p-bootstrap";
import Gossipsub from "libp2p-gossipsub";
import {create} from "libp2p";
import PeerId from "peer-id";
import PeerInfo from "peer-info";
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
                    let peerInfo: object | undefined;

                    if (config.BOOTSTRAP_NODE_PRIVATE_KEY && config.BOOTSTRAP_NODE_PUBLIC_KEY && config.BOOTSTRAP_NODE_PEER_ID) {
                        const peerId = await PeerId.createFromJSON({
                            id: config.BOOTSTRAP_NODE_PEER_ID.trim(),
                            pubKey: config.BOOTSTRAP_NODE_PUBLIC_KEY.trim(),
                            privKey: config.BOOTSTRAP_NODE_PRIVATE_KEY.trim()
                        });
                        peerInfo = new PeerInfo(peerId);
                    }

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
                        peerInfo,
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
    imports: [ScheduleModule.register(), AccountModule],
    exports: [DiscoveryService]
})
export class DiscoveryModule {}
