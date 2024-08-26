import { EventEmitter } from "node:events";

const eventHandler = new EventEmitter();
const events = eventHandler.eventNames()

events.forEach((event) => {
    eventHandler.on(event, (...args) => {
        console.log(`Event: ${event.toString()} with args: ${args}`);
    })
})
export default  eventHandler