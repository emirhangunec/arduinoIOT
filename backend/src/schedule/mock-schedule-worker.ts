import {getAllRooms, getDeviceById} from "@/mock-data";
import eventHandler from "@/events";

interface Schedule {
    roomId: string;
    dayOfWeek: number;
    openHour: string;
    closeHour: string;
    isElectricityOn: boolean;
    isHeaterOn: boolean;
    targetTemperature?: number | null;
}

// Track last applied state for each room to avoid duplicate commands
const lastAppliedState = new Map<string, {
    electricityOn: boolean;
    heaterOn: boolean;
    isInSchedule: boolean;
    lastKnownTemperature?: number;
}>();

// Get current day of week (0 = Monday, 6 = Sunday)
const getDayOfWeek = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

// Check if current time is between openHour and closeHour
const isBetween = (now: Date, openHour: string, closeHour: string): boolean => {
    const [openH, openM] = openHour.split(":").map(Number);
    const [closeH, closeM] = closeHour.split(":").map(Number);
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

// Apply schedule to a device (only if state changed)
const applySchedule = (schedule: Schedule, isInSchedule: boolean) => {
    const room = getAllRooms().find(r => r.id === schedule.roomId);
    if (!room || !room.device) return;
    
    const device = getDeviceById(room.device.id) as (ReturnType<typeof getDeviceById> & {
        temperature?: number;
        electricityStatus?: boolean;
        heatingStatus?: boolean;
    }) | null;
    if (!device || !device.isOnline) return;
    
    const roomStateKey = room.id;
    const lastState = lastAppliedState.get(roomStateKey);
    
    // Determine target state
    const targetElectricity = isInSchedule ? (schedule.isElectricityOn || false) : false;
    let targetHeater = isInSchedule ? (schedule.isHeaterOn || false) : false;

    if (isInSchedule && targetHeater && typeof (schedule as any).targetTemperature === "number" && !Number.isNaN((schedule as any).targetTemperature)) {
        const desiredTemperature = (schedule as any).targetTemperature as number;
        const tolerance = 0.5;
        const currentTemperature = typeof (device as any).temperature === "number"
            ? (device as any).temperature as number
            : lastState?.lastKnownTemperature;
        if (typeof currentTemperature === "number") {
            if (currentTemperature < desiredTemperature - tolerance) {
                targetHeater = true;
            } else if (currentTemperature > desiredTemperature + tolerance) {
                targetHeater = false;
            } else {
                targetHeater = lastState?.heaterOn ?? (schedule.isHeaterOn || false);
            }
        }
    }
    
    // Check if state changed
    const stateChanged = !lastState || 
        lastState.electricityOn !== targetElectricity ||
        lastState.heaterOn !== targetHeater ||
        lastState.isInSchedule !== isInSchedule;
    
    if (!stateChanged) {
        // State hasn't changed, no need to send commands
        return;
    }
    
    // Get current device status directly from device
    const currentElectricity = (device as any).electricityStatus || false;
    const currentHeater = (device as any).heatingStatus || false;
    
    // Only send commands if target state differs from current state
    if (currentElectricity !== targetElectricity) {
        eventHandler.emit('toggle-electricity', {
            deviceId: device.id,
            electricityStatus: targetElectricity,
            source: 'schedule'
        });
    }
    
    if (currentHeater !== targetHeater) {
        eventHandler.emit('toggle-heating', {
            deviceId: device.id,
            heatingStatus: targetHeater,
            source: 'schedule'
        });
    }
    
    // Update last applied state
    lastAppliedState.set(roomStateKey, {
        electricityOn: targetElectricity,
        heaterOn: targetHeater,
        isInSchedule: isInSchedule,
        lastKnownTemperature: typeof (device as any).temperature === "number"
            ? (device as any).temperature as number
            : lastState?.lastKnownTemperature
    });
}

const evaluateRoomSchedule = (room: ReturnType<typeof getAllRooms>[number], now: Date, dayOfWeek: number) => {
    if (!room.openHours || room.openHours.length === 0) {
        const roomStateKey = room.id;
        const lastState = lastAppliedState.get(roomStateKey);
        if (lastState && lastState.isInSchedule) {
            if (room.device && room.device.isOnline) {
                eventHandler.emit('toggle-electricity', {
                    deviceId: room.device.id,
                    electricityStatus: false,
                    source: 'schedule'
                });
                eventHandler.emit('toggle-heating', {
                    deviceId: room.device.id,
                    heatingStatus: false,
                    source: 'schedule'
                });
            }
            lastAppliedState.set(roomStateKey, {
                electricityOn: false,
                heaterOn: false,
                isInSchedule: false,
                lastKnownTemperature: typeof (room.device as any)?.temperature === "number"
                    ? ((room.device as any).temperature as number)
                    : lastState?.lastKnownTemperature
            });
        }
        return;
    }

    const todaySchedule = room.openHours.find(
        (oh: any) => oh.dayOfWeek === dayOfWeek
    );

    const roomStateKey = room.id;

    if (!todaySchedule) {
        const lastState = lastAppliedState.get(roomStateKey);
        if (lastState && lastState.isInSchedule) {
            if (room.device && room.device.isOnline) {
                eventHandler.emit('toggle-electricity', {
                    deviceId: room.device.id,
                    electricityStatus: false,
                    source: 'schedule'
                });
                eventHandler.emit('toggle-heating', {
                    deviceId: room.device.id,
                    heatingStatus: false,
                    source: 'schedule'
                });
            }
            lastAppliedState.set(roomStateKey, {
                electricityOn: false,
                heaterOn: false,
                isInSchedule: false,
                lastKnownTemperature: typeof (room.device as any)?.temperature === "number"
                    ? ((room.device as any).temperature as number)
                    : lastState?.lastKnownTemperature
            });
        }
        return;
    }

    const isInSchedule = isBetween(now, todaySchedule.openHour, todaySchedule.closeHour);

    applySchedule({
        roomId: room.id,
        dayOfWeek: todaySchedule.dayOfWeek,
        openHour: todaySchedule.openHour,
        closeHour: todaySchedule.closeHour,
        isElectricityOn: todaySchedule.isElectricityOn || false,
        isHeaterOn: todaySchedule.isHeaterOn || false
    }, isInSchedule);
};

const checkScheduleForRoom = (roomId: string) => {
    const room = getAllRooms().find(r => r.id === roomId);
    if (!room) return;
    const now = new Date();
    const dayOfWeek = getDayOfWeek(now);
    evaluateRoomSchedule(room, now, dayOfWeek);
};

// Check and apply schedules
const checkSchedules = () => {
    const now = new Date();
    const dayOfWeek = getDayOfWeek(now);
    const rooms = getAllRooms();
    rooms.forEach(room => evaluateRoomSchedule(room, now, dayOfWeek));
};

// Start schedule worker
export function startMockScheduleWorker() {
    console.log('[Schedule Worker] Starting mock schedule worker...');
    
    // Check schedules immediately
    checkSchedules();
    
    // Check every minute
    setInterval(() => {
        checkSchedules();
    }, 60 * 1000);
    
    // Also check when device connects
    eventHandler.on('device-connected', (deviceId: string) => {
        console.log('[Schedule Worker] Device connected, checking schedule:', deviceId);
        setTimeout(() => {
            checkSchedules();
        }, 2000); // Wait 2 seconds for device to be ready
    });

    // Re-evaluate schedules when they are updated from management panel
    eventHandler.on('room-schedule-updated', (roomId?: string) => {
        console.log('[Schedule Worker] Room schedule updated:', roomId);
        if (roomId) {
            lastAppliedState.delete(roomId);
            setTimeout(() => checkScheduleForRoom(roomId), 500);
        } else {
            lastAppliedState.clear();
            setTimeout(() => checkSchedules(), 500);
        }
    });
}

