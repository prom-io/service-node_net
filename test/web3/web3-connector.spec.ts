import {EventEmitter} from "events";
import {anyFunction, instance, mock, verify, when} from "ts-mockito";
import App from "../../src/application";
import Web3Connector from "../../src/web3";

describe('Web3Connector tests', () => {
    describe('Web3Connector.bootstrap()', () => {
        it('Subscribes to "geth::ipc::connect" event', () => {
            const appMock = mock(App);
            const appMockInstance = instance(appMock);
            const gethMock = mock<EventEmitter>();
            const gethMockInstance = instance(gethMock);

            when(appMock.getModule("geth")).thenReturn(gethMockInstance);

            const web3Connector = new Web3Connector(appMockInstance);
            web3Connector.bootstrap();

            verify(gethMock.on("geth::ipc::connect", anyFunction())).called();
        })
    })
});
