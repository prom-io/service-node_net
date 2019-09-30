import express from "express";
import {ExpressApp} from "../api";
import App from "../application";
import GethExecutor from "../commands/executor/geth";
import {DdsApiClient} from "../dds-api";
import IPCListener from "../ipc";
import Web3Connector from "../web3";
import DB from "./../common/DB";
import IBootstrap from "./../common/interfaces/IBootstrap";

const Bootstrap: Array<(app: App) => IBootstrap> = [
    (app) => {
        const db = new DB(app);
        app.addModule("db", db);
        return db;
    },
    (app) => {
        const g = new GethExecutor.GethRunner(app);
        app.addModule("geth", g);
        (new GethExecutor.GethInitializer(app).run<void>())
            .then(() => (new GethExecutor.GethAccountInitial(app)).run<void>())
            .then(() => g.run());
        return g;
    },
    (app) => {
        const w3 = new Web3Connector(app);
        app.addModule("web3", w3);
        return w3;
    },
    (app) => {
        const ipc = new IPCListener(app);
        app.addModule("ipclistener", ipc);
        return ipc;
    },
    (app) => {
        const ddsApiClient = new DdsApiClient(app, "http://localhost:8080");
        app.addModule("dds", ddsApiClient);
        return ddsApiClient;
    },
    (app) => {
        const expressApp = new ExpressApp(app, express(), 3000);
        app.addModule("api", expressApp);
        return expressApp;
    }
];

export default Bootstrap;
