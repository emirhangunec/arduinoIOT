import WebSocket, {WebSocketServer} from "ws";
import eventHandler from "../events";
import {DeviceWithRoomAndOpenHours} from "db";
import {getDeviceWithRoomAndOpenHours} from "@/helpers/device";

const wss = new WebSocketServer({noServer: true});

eventHandler.on('online-device-ids', async (deviceIds: string[]) => {
    const devices: (DeviceWithRoomAndOpenHours | null)[] = await Promise.all(deviceIds.map(async (id) => {
        return getDeviceWithRoomAndOpenHours(id);
    }))

    const onlineDevices = devices.filter(d => d !== null) as DeviceWithRoomAndOpenHours[]
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            eventName: 'online-devices',
            data: onlineDevices
        }))
    });
})

wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (message: string, isBinary) => {
        console.log(message);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export default wss;