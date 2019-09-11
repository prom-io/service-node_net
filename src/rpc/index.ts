import handler from './caller'
import App from '../application'

const Rpc = (app: App) => {
    return { handle: handler(app)}
}

export default Rpc