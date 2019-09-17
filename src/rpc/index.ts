import App from "../application";
import handler from "./caller";

const Rpc = (app: App) => {
    return { handle: handler(app)};
};

export default Rpc;
