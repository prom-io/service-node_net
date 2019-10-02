import {Express, json, Router} from "express";
import {anyFunction, instance, mock, verify, when} from "ts-mockito";
import {Logger} from "winston";
import {ExpressApp} from "../../src/api";
import {FilesController} from "../../src/api/controllers";
import App from "../../src/application";
import {DdsApiClient} from "../../src/dds-api";

describe("ExpressApp tests", () => {
    describe("ExpressApp.bootstrap()", () => {
        it("Initializes controllers and starts express app on specified port", () => {
            const app = mock(App);
            const appInstance = instance(app);
            const express = mock<Express>();
            const expressInstance = instance(express);
            const logger = mock<Logger>();
            const loggerInstance = instance(logger);

            when(app.getModule("logger")).thenReturn(loggerInstance);

            const expressPort = 3000;
            const expressApp = new ExpressApp(appInstance, expressInstance, expressPort);
            expressApp.bootstrap();

            verify(express.listen(expressPort, anyFunction())).called();
        })
    })
});
