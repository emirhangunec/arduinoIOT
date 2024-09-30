import {type DeviceWithRoomAndOpenHours} from "PrismaTypes";

interface DeviceStatus {
    deviceId: string
    windowStatus: boolean
    electricityStatus: boolean
    heatingStatus: boolean
    isBusy: boolean
}

export const useDevicesStore = defineStore('devices', () => {
    const {$socket, $api} = useNuxtApp()
    const devices = ref<DeviceWithRoomAndOpenHours[]>([])
    const busyDevices = ref<{
        deviceId: string
        type: 'electricity' | 'heating'
    }[]>([])
    const deviceStatus = ref<DeviceStatus[]>([])
    const toast = useToast()

    watch(devices, (newDevices) => {

        for (const device of newDevices) {
            const deviceStatusIndex = deviceStatus.value.findIndex(status => status.deviceId === device.id)
            if (deviceStatusIndex === -1) {
                deviceStatus.value.push({
                    deviceId: device.id,
                    windowStatus: false,
                    electricityStatus: false,
                    heatingStatus: false,
                    isBusy: busyDevices.value.map(i =>i.deviceId).includes(device.id)
                })
            } else {
                console.log('Device already exists, not changing anything')
            }
        }
    })

    $socket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.eventName) {
            case 'online-devices':
                devices.value = data.data
                break;

            case 'window-status':
                const deviceStatusIndex = deviceStatus.value.findIndex(status => status.deviceId === data.data.id)
                if (deviceStatusIndex === -1) return console.error('Device not found')
                deviceStatus.value[deviceStatusIndex].windowStatus = data.data.window
                break;

            case 'electricity-status':
                const deviceStatusIndex2 = deviceStatus.value.findIndex(status => status.deviceId === data.data.id)
                if (deviceStatusIndex2 === -1) return console.error('Device not found')
                deviceStatus.value[deviceStatusIndex2].electricityStatus = data.data.electricityStatus
                if (busyDevices.value.find(i => i.deviceId === data.data.id && i.type === 'electricity')) {
                    busyDevices.value = busyDevices.value.filter(i => i.deviceId !== data.data.id && i.type !== 'electricity')
                }
                break;
            case 'heating-status':
                const deviceStatusIndex3 = deviceStatus.value.findIndex(status => status.deviceId === data.data.id)
                if (deviceStatusIndex3 === -1) return console.error('Device not found')
                deviceStatus.value[deviceStatusIndex3].heatingStatus = data.data.heatingStatus
                if (busyDevices.value.find(i => i.deviceId === data.data.id && i.type === 'heating')) {
                    busyDevices.value = busyDevices.value.filter(i => i.deviceId !== data.data.id && i.type !== 'heating')
                }
                break;
            default:
                console.log(`[WS] Message: ` + JSON.stringify(data));
                break;

        }
    }

    const getDeviceStatus = (deviceId: string) => {
        return deviceStatus.value.find(status => status.deviceId === deviceId)
    }
    const isDeviceBusy = (deviceId: string) => {
        return !!busyDevices.value.find(i => i.deviceId === deviceId)
    }

    const toggleElectricity = async (deviceId: string) => {
        const isBusy = busyDevices.value.find(i => i.deviceId === deviceId && i.type === 'electricity')
        if (isBusy) return console.error('Already waiting for response')
        busyDevices.value.push({
            deviceId,
            type: 'electricity'
        })

        const currentStatus = getDeviceStatus(deviceId)
        if (!currentStatus) return console.error('Device not found')

        const dataToSend = {
            eventName: 'toggle-electricity',
            deviceId,
            electricityStatus: !currentStatus.electricityStatus
        }
        const deviceStatusIndex = deviceStatus.value.findIndex(status => status.deviceId === deviceId)
        $socket.send(JSON.stringify(dataToSend))
    }

    const toggleHeating = async (deviceId: string) => {
        const isBusy = busyDevices.value.find(i => i.deviceId === deviceId && i.type === 'heating')
        if (isBusy) return console.error('Already waiting for response')
        busyDevices.value.push({
            deviceId,
            type: 'heating'
        })

        const currentStatus = getDeviceStatus(deviceId)
        if (!currentStatus) return console.error('Device not found')

        const dataToSend = {
            eventName: 'toggle-heating',
            deviceId,
            heatingStatus: !currentStatus.heatingStatus
        }
        $socket.send(JSON.stringify(dataToSend))
    }

    return {
        devices,
        busyDevices,
        deviceStatus,
        isDeviceBusy,
        getDeviceStatus,
        toggleElectricity,
        toggleHeating,
    }


})