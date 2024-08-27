import WebSocket, {WebSocketServer} from "ws";
import eventHandler from "../events";

const wss = new WebSocketServer({noServer: true});

eventHandler.on('online-devices', (device) => {
    wss.clients.forEach((client) => {
        const data = {
            eventName: 'online-devices',
            data: device
        }
        client.send(JSON.stringify(data));
    });
})

wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (message: string, isBinary) => {
        console.log(message);
    });

    ws.on('close', () => {
    });
});

export default wss;