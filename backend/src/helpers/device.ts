import db, {Device, DeviceWithRoomAndOpenHours} from 'db'

export async function updateOrCreateDevice(id: string, ip: string, isOnline: boolean): Promise<Device> {
    return db.device.upsert({
        where: {
            id
        },
        update: {
            isOnline,
            ip
        },
        create: {
            id,
            ip,
            isOnline
        }
    });
}

export async function updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    return db.device.update({
        where: {
            id
        },
        data
    });
}

export async function getDeviceWithRoomAndOpenHours(deviceId: string): Promise<DeviceWithRoomAndOpenHours | null> {
    return db.device.findUnique({
        where: {
            id: deviceId
        },
        include: {
            room: {
                include: {
                    openHours: true
                }
            }
        }
    })
}

export async function makeAllDevicesOffline(): Promise<void> {
    await db.device.updateMany({
        where:{
            isOnline: true
        },
        data: {
            isOnline: false
        }
    });
}