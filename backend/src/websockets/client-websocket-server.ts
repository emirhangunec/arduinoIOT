import WebSocket, {WebSocketServer} from "ws";
import eventHandler from "../events";
import {DeviceWithRoomAndOpenHours} from "db";
import {getDeviceWithRoomAndOpenHours} from "@/helpers/device";

const wss = new WebSocketServer({noServer: true});

eventHandler.on('online-device-ids', async (deviceIds: string[]) => {
    const devices: (DeviceWithRoomAndOpenHours | null)[] = await Promise.all(deviceIds.map(getDeviceWithRoomAndOpenHours))

    const onlineDevices = devices.filter(d => d !== null) as DeviceWithRoomAndOpenHours[]
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            eventName: 'online-devices',
            data: onlineDevices
        }))
    });
})

eventHandler.on('window-status', async (data: {
    id: string,
    window: boolean
}) => {

    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            eventName: 'window-status',
            data
        }))
    });

})

eventHandler.on('electricity-status', async (data: {
    id: string,
    electricityStatus: boolean
}) => {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            eventName: 'electricity-status',
            data
        }))
    });
})

eventHandler.on('heating-status', async (data: {
    id: string,
    heatingStatus: boolean
}) => {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            eventName: 'heating-status',
            data
        }))
    });
})

wss.on('connection', (ws: WebSocket, request) => {
    ws.on('message', (message: string, isBinary) => {
            const parsedMessage = message.toString();
            const data = JSON.parse(parsedMessage);
            switch (data.eventName) {
                case 'toggle-electricity':
                    eventHandler.emit('toggle-electricity', {
                            deviceId: data.deviceId,
                            electricityStatus: data.electricityStatus
                        }
                    );
                    break;
                case 'toggle-heating':
                    eventHandler.emit('toggle-heating', {
                            deviceId: data.deviceId,
                            heatingStatus: data.heatingStatus
                        }
                    );
                    break;
                default:
                    console.log(`[WS] Message: ` + JSON.stringify(data));
                    break
            }
        }
    )
        ;

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    export default wss;