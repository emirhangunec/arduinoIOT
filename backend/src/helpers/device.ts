import {Device, DeviceWithRoomAndOpenHours} from 'db';
import {
    updateOrCreateDevice as mockUpdateOrCreateDevice,
    updateDeviceStatus as mockUpdateDeviceStatus,
    getDeviceWithRoomAndOpenHours as mockGetDeviceWithRoomAndOpenHours,
    makeAllDevicesOffline as mockMakeAllDevicesOffline,
    getDeviceById
} from '@/mock-data';

export async function updateOrCreateDevice(id: string, ip: string, isOnline: boolean): Promise<Device> {
    return mockUpdateOrCreateDevice(id, ip, isOnline);
}

export async function updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const device = getDeviceById(id);
    if (!device) {
        throw new Error('Device not found');
    }
    const updated = mockUpdateDeviceStatus(id, data);
    if (!updated) {
        throw new Error('Failed to update device');
    }
    return updated;
}

export async function getDeviceWithRoomAndOpenHours(deviceId: string): Promise<DeviceWithRoomAndOpenHours | null> {
    return mockGetDeviceWithRoomAndOpenHours(deviceId);
}

export async function makeAllDevicesOffline(): Promise<void> {
    mockMakeAllDevicesOffline();
}
