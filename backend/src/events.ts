import {EventEmitter} from "node:events";


class EventHandler extends EventEmitter {
    constructor() {
        super();
    }

    emit(eventName: string | symbol, ...args: any) {
        console.log(`Event emitted: ${eventName.toString()} with args: ${args}`);
        return super.emit(eventName, ...args);
    }

}

const eventHandler = new EventHandler();

export default eventHandler;