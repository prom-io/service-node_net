import {Router} from "express";

export interface IAppController {
    getRouter(): Router
}
