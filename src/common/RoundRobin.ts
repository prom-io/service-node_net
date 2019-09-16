import DataStore from "nedb";
import App from "../application";


const Counter = () => {
    let index = 0

    return {
        reset(){
            index = 0
        },
        inc(){
            index++
        },
        current(){
            return index
        }
    }
}


export default (app: App) => {
    const db:DataStore = app.getModule('db').getStore()
    const cntr = Counter()

    return (peers:any[]) => {
        const idx = cntr.current()
        cntr.inc()
        return idx % peers.length
    }
}