import util from 'util'
import {getLogger} from './logger'
import App from './application'
import path from 'path'
import {config} from 'dotenv'



config()
let logger = getLogger()
let app = new App(path.dirname(__dirname), logger)
app.setLogger(logger)
app.bootstrap()
app.run()


