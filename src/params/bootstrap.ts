import express from "express";
import {ExpressApp} from "../api";
import App from "../application";
import {BillingApiClient} from "../billing-api";
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
        const ddsApiClient = new DdsApiClient(app, String(process.env.DDS_API_BASE_URL || "http://localhost:8080"));
        app.addModule("dds", ddsApiClient);
        return ddsApiClient;
    },
    (app) => {
        const billingApiClient = new BillingApiClient(app, String(process.env.BILLING_API_BASE_URL || "http://localhost:3001"));
        app.addModule("billing", billingApiClient);
        return billingApiClient;
    },
    (app) => {
        const expressApp = new ExpressApp(app, express(), Number(process.env.SERVICE_NODE_API_PORT) || 3002);
        app.addModule("api", expressApp);
        return expressApp;
    }
];

export default Bootstrap;
