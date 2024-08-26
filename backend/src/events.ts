import { EventEmitter } from "node:events";

const eventHandler = new EventEmitter();

eventHandler.on("*",(event,...args)=>{
    console.log(`Event ${event} was triggered with data:`,args);
})

export default  eventHandler