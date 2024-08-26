import {EventEmitter} from "node:events";

type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];

export class WildcardEventEmitter<T extends EventMap<T> = DefaultEventMap> extends EventEmitter<T> {

    emit<K>(eventName: T extends [never] ? string | symbol : keyof T | K, ...args: T extends [never] ? any[] : K extends keyof T ? T[K] : never): boolean {
        //@ts-expect-error
        super.emit('*', eventName, ...args);
        return super.emit(eventName, ...args);// || super.emit('', ...args);
    }

    //@ts-expect-error
    on(eventName: '*', listener: (eventName: keyof T, ...args: any[]) => void): this;
    //@ts-expect-error
    on<K>(eventName: T extends [never] ? string | symbol : (keyof T) | K, listener: T extends [never] ? (...args: any[]) => void : K extends keyof T ? T[K] extends unknown[] ? (...args: T[K]) => void : never : never): this {
        if(eventName === '*')
            //@ts-expect-error
            return super.on('*', ()=>listener(eventName, ...args))
        return super.on(eventName, listener);
    }

}
const eventHandler = new WildcardEventEmitter();

eventHandler.on('*', (eventName, ...args) => {
    console.log(`Event ${eventName.toString()} was emitted with args: ${args}`);
})

export default eventHandler;