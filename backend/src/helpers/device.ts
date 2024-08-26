import db, {Device} from 'db'

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