import WebSocket, {WebSocketServer} from "ws";
import {updateDevice, updateOrCreateDevice} from "@/helpers/device";
import eventHandler from "@/events";
import prisma from "db";

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
        switch (key) {
            case "id":
                ws.id = value;
                if (ws.ip === undefined) return;
                const res = await updateOrCreateDevice(ws.id, ws.ip, true);
                break;
            case "ping":
                ws.lastPing = Date.now();
                eventHandler.emit("device-ping", {id: ws.id, isOnline: true});
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
        console.log("Device disconnected.");
        eventHandler.emit("device-ping", {id: ws.id, isOnline: false});
        const res = await updateDevice(ws.id, {isOnline: false});
    });
});

const getDevice = async (id: string) => {
    return prisma.device.findUnique({
        where: {
            id
        }
    });
}

setInterval(async () => {
    const onlineClients: IotWebSocket[] = [];
    wss.clients.forEach((ws: WebSocket) => {
        const client = ws as IotWebSocket;
        if (client.readyState !== WebSocket.OPEN) return;
        if (client.lastPing === undefined) return;
        if (client.id === undefined) return;

        if (client.lastPing < Date.now() - 30000) {
            console.log("Client is not responding. Terminating connection.");
            eventHandler.emit("device-ping", {id: client.id, isOnline: false});
            client.terminate();
            return;
        }

        onlineClients.push(client);
    });

    if (onlineClients.length === 0) {
        const fakeData = await prisma.device.findFirst({
            where: {
                id: '1'
            }
        })
        if (fakeData === null) return;

        const fakeClients = [{
            id: fakeData.id,
            ip: fakeData.ip,
            window: Math.random() > 0.5,
            lastPing: Date.now()
        }]
        const simpleClients = await Promise.all(fakeClients.filter((client) => client.id !== undefined).map(async (client) => await getDevice(client.id as string)))

        eventHandler.emit("online-devices", simpleClients);
        return;
    }

    const simpleClients = await Promise.all(onlineClients.filter((client) => client.id !== undefined).map(async (client) => await getDevice(client.id as string)))


    eventHandler.emit("online-devices", simpleClients);

}, 5000);

export default wss;
