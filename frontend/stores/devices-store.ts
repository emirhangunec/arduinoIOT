import {type DeviceWithRoomAndOpenHours} from "PrismaTypes";

export const useDevicesStore = defineStore('rooms', () => {
    const {$socket, $api} = useNuxtApp()
    const devices = ref<DeviceWithRoomAndOpenHours[]>([])

    watch(devices, (newDevices) => {

    })

    $socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.eventName) {
            case 'online-devices':
                devices.value = data.data
                break;

            default:
                console.log(`[WS] Message: ` + JSON.stringify(data));
                break;

        }
    }

    return {
        devices,
    }


})