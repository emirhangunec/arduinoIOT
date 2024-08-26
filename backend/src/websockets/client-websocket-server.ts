import WebSocket, {WebSocketServer} from "ws";
import eventHandler from "../events";

const wss = new WebSocketServer({noServer: true});

eventHandler.on('device-online', (device) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(device));
        }
    });
})

wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (message: string, isBinary) => {
        console.log(message);
    });

    ws.on('close', () => {});
});

export default wss;