import {type Device, type RoomWithOpenHours} from "PrismaTypes";

export const useRoomsStore = defineStore('rooms', () => {
    const {$socket, $api} = useNuxtApp()
    const rooms = ref<RoomWithOpenHours[]>([])
    const devices = ref<Device[]>([])

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
    watch(devices, (newDevices) => {
        const roomIds = newDevices.map((device) => device.roomId)
        const uniqueRoomIds = Array.from(new Set(roomIds))
        const roomsToFetch = uniqueRoomIds.filter((roomId) => !rooms.value.find((room) => room.id === roomId) && !!roomId)

        roomsToFetch.forEach(async (roomId) => {
            const res = await $api<{ message: string, data: RoomWithOpenHours }>(`/rooms/${roomId}`)
            rooms.value.push(res.data)
        })

    })

    return {
        rooms,
        devices,

    }


})