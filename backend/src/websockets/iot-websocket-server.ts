import WebSocket, {WebSocketServer} from "ws";
import {updateDevice, updateOrCreateDevice} from "@/helpers/device";
import eventHandler from "@/events";

const onlineClientIds = new Set<string>();

const wss = new WebSocketServer({noServer: true});

interface IotWebSocket extends WebSocket {
    id: string | undefined;
    lastPing: number | undefined;
    ip: string | undefined;
    window: boolean | undefined;
}

wss.on("connection", (ws: IotWebSocket, request) => {
    ws.ip = request.socket.remoteAddress;
    ws.on("message", async function message(data, isBinary) {
        const parsedData = data.toString();
        const [key, value] = parsedData.split(":");
        ws.lastPing = Date.now();
        switch (key) {
            case "id":
                ws.id = value;
                if (ws.ip === undefined) return;
                const res = await updateOrCreateDevice(ws.id, ws.ip, true);
                console.log(res);
                onlineClientIds.add(ws.id);
                eventHandler.emit("online-device-ids", Array.from(onlineClientIds));
                break;
            case "ping":
                break;
            case "window":
                ws.window = parseInt(value) === 1;
                if (ws.id === undefined) return;
                eventHandler.emit("window-status", {id: ws.id, window: ws.window});
                break;
            default:
                console.log(`user sended:${parsedData}`);
                break;
        }
    });
    ws.on("close", async () => {
        if (ws.id === undefined || ws.ip === undefined) return;
        const res = await updateDevice(ws.id, {isOnline: false});
        onlineClientIds.delete(ws.id);
        eventHandler.emit("online-device-ids", Array.from(onlineClientIds));
    });
});

setInterval(() => {
// test data, development only
//     if (onlineClientIds.size === 0) {
//         const fakeDataId = '1'
//         onlineClientIds.add(fakeDataId)
//     }
//     else{
//         onlineClientIds.delete('1')
//     }
    eventHandler.emit("online-device-ids", Array.from(onlineClientIds));
}, 5000)

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
        const client = ws as IotWebSocket;
        if (client.readyState !== WebSocket.OPEN
            || client.lastPing === undefined
            || client.id === undefined) {
            console.log("client terminated");
            client.terminate()
            if (client.id === undefined) return;
            onlineClientIds.delete(client.id)
            return;
        }
        if (client.lastPing < Date.now() - 30000) {
            client.terminate();
            onlineClientIds.delete(client.id)
        }
    })
}, 5000)


export default wss;
