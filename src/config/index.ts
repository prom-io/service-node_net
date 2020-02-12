import {loadConfig} from "env-decorator";
import {EnvConfig} from "./EnvConfig";

export const config: EnvConfig = loadConfig(EnvConfig);

export * from "./LogLevel";
