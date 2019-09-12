import {config} from "dotenv";
import path from "path";
import util from "util";
import App from "./application";
import {getLogger} from "./logger";

config();
const logger = getLogger();
const app = new App(path.dirname(__dirname), logger);
app.setLogger(logger);
app.bootstrap();
app.run();
