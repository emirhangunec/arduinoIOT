import WebSocket, {WebSocketServer} from "ws";

const wss = new WebSocketServer({noServer: true});


wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (message: string, isBinary) => {
        console.log(message);
    });

    ws.on('close', () => {});
});

export default wss;