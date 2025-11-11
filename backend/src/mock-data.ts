import type {Device, Room, DeviceWithRoomAndOpenHours, RoomWithOpenHoursAndDeviceAndUsers} from 'db';

interface MockDevice extends Device {
    windowStatus?: boolean;
    electricityStatus?: boolean;
    heatingStatus?: boolean;
    lightStatus?: boolean;
    temperature?: number;
}

interface MockRoom extends Room {
    device: MockDevice | null;
    openHours: any[];
    users: any[];
}

// In-memory storage
const rooms = new Map<string, MockRoom>();
const devices = new Map<string, MockDevice>();
const company = {
    id: 'demo-company-1',
    name: 'Demo Building'
};

// Generate 20 floors × 10 rooms = 200 rooms
function generateMockData() {
    const sectors = ['A', 'B', 'C', 'D', 'E'];
    
    for (let floor = 1; floor <= 20; floor++) {
        for (let roomNum = 1; roomNum <= 10; roomNum++) {
            const roomId = `room-${floor}-${roomNum}`;
            const deviceId = `device-${floor}-${roomNum}`;
            const sector = sectors[Math.floor((roomNum - 1) / 2)];
            
            const device: MockDevice = {
                id: deviceId,
                ip: `192.168.1.${floor * 10 + roomNum}`,
                isOnline: Math.random() > 0.3, // 70% online
                hasWindowSensor: true,
                hasHeaterControl: true,
                hasElectricityControl: true,
                roomId: roomId,
                windowStatus: Math.random() > 0.5,
                electricityStatus: Math.random() > 0.5,
                heatingStatus: Math.random() > 0.5,
                lightStatus: Math.random() > 0.5,
                temperature: 18 + Math.random() * 10 // 18-28 degrees
            };
            
            const room: MockRoom = {
                id: roomId,
                name: `Room ${floor}-${roomNum}`,
                doorNumber: `${floor}${String(roomNum).padStart(2, '0')}`,
                floor: String(floor),
                sector: sector,
                device: device,
                openHours: [],
                users: []
            };
            
            devices.set(deviceId, device);
            rooms.set(roomId, room);
        }
    }
}

// Initialize on module load
generateMockData();

export function getCompany() {
    return company;
}

export function getAllRooms(): RoomWithOpenHoursAndDeviceAndUsers[] {
    return Array.from(rooms.values()) as RoomWithOpenHoursAndDeviceAndUsers[];
}

export function getRoomById(id: string): RoomWithOpenHoursAndDeviceAndUsers | null {
    const room = rooms.get(id);
    return room ? (room as RoomWithOpenHoursAndDeviceAndUsers) : null;
}

export function getDeviceById(id: string): MockDevice | null {
    return devices.get(id) || null;
}

export function getDeviceStatus(id: string): {electricityStatus?: boolean; heatingStatus?: boolean} | null {
    const device = devices.get(id);
    if (!device) return null;
    return {
        electricityStatus: device.electricityStatus,
        heatingStatus: device.heatingStatus
    };
}

export function updateDeviceStatus(id: string, updates: Partial<MockDevice>): MockDevice | null {
    const device = devices.get(id);
    if (!device) return null;
    
    Object.assign(device, updates);
    devices.set(id, device);
    
    // Update device in room
    if (device.roomId) {
        const room = rooms.get(device.roomId);
        if (room && room.device) {
            Object.assign(room.device, updates);
        }
    }
    
    return device;
}

export function updateOrCreateDevice(id: string, ip: string, isOnline: boolean): MockDevice {
    let device = devices.get(id);
    
    if (device) {
        device.ip = ip;
        device.isOnline = isOnline;
    } else {
        // Create new device if it doesn't exist
        device = {
            id,
            ip,
            isOnline,
            hasWindowSensor: true,
            hasHeaterControl: true,
            hasElectricityControl: true,
            roomId: null,
            windowStatus: false,
            electricityStatus: false,
            heatingStatus: false,
            lightStatus: false,
            temperature: 20
        };
        devices.set(id, device);
    }
    
    return device;
}

export function makeAllDevicesOffline(): void {
    devices.forEach(device => {
        device.isOnline = false;
    });
}

export function getDeviceWithRoomAndOpenHours(deviceId: string): DeviceWithRoomAndOpenHours | null {
    const device = devices.get(deviceId);
    if (!device) return null;
    
    const room = device.roomId ? rooms.get(device.roomId) : null;
    
    return {
        ...device,
        room: room ? {
            ...room,
            openHours: room.openHours || []
        } : null
    } as DeviceWithRoomAndOpenHours;
}

export function getOnlineDevices(): DeviceWithRoomAndOpenHours[] {
    const onlineDevices: DeviceWithRoomAndOpenHours[] = [];
    
    devices.forEach(device => {
        if (device.isOnline) {
            const deviceWithRoom = getDeviceWithRoomAndOpenHours(device.id);
            if (deviceWithRoom) {
                onlineDevices.push(deviceWithRoom);
            }
        }
    });
    
    return onlineDevices;
}

export function updateRoomOpenHours(roomId: string, openHours: Array<{
    dayOfWeek: number;
    openHour: string;
    closeHour: string;
    isElectricityOn: boolean;
    isHeaterOn: boolean;
}>): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;
    
    // Convert to OpenHour format
    room.openHours = openHours.map(oh => ({
        id: `oh-${roomId}-${oh.dayOfWeek}-${Date.now()}`,
        dayOfWeek: oh.dayOfWeek,
        openHour: oh.openHour,
        closeHour: oh.closeHour,
        isElectricityOn: oh.isElectricityOn,
        isHeaterOn: oh.isHeaterOn,
        roomId: roomId
    }));
    
    return true;
}

