import util from 'util'
import childProcess from 'child_process'
import {getLogger} from './logger'
import App from './application'
import path from 'path'



let logger = getLogger()
let executable = util.promisify(childProcess.exec)
let app = new App(__dirname, logger)
app.setLogger(logger)
app.bootstrap()
app.run()