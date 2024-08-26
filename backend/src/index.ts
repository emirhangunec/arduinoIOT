import http from 'http';
import app from "./api";
import ArduinoWebSocketServer from "./websockets/iot-websocket-server";
import ClientWebsocketServer from "./websockets/client-websocket-server";
import dotenv from 'dotenv';

dotenv.config();
const server = http.createServer(app);



server.on('upgrade', (request, socket, head) => {
    console.log(request.url, request.headers);
    if (request.url?.startsWith('/iot')) {
        ArduinoWebSocketServer.handleUpgrade(request, socket, head, (ws) => {
            ArduinoWebSocketServer.emit('connection', ws, request);
        });
    } else if (request.url?.startsWith('/client')) {
        ClientWebsocketServer.handleUpgrade(request, socket, head, (ws) => {
            ClientWebsocketServer.emit('connection', ws, request);
        });
    }
});

const PORT = process.env.BACKEND_PORT ?? 3001;

server.listen(PORT, () => {
    console.log(`Sunucu http://0.0.0.0:${PORT} adresinde çalışıyor.`);
});