import {getAllRooms, getDeviceById} from "@/mock-data";
import eventHandler from "@/events";

interface Schedule {
    roomId: string;
    dayOfWeek: number;
    openHour: string;
    closeHour: string;
    isElectricityOn: boolean;
    isHeaterOn: boolean;
}

// Track last applied state for each room to avoid duplicate commands
const lastAppliedState = new Map<string, {
    electricityOn: boolean;
    heaterOn: boolean;
    isInSchedule: boolean;
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
    
    const device = getDeviceById(room.device.id);
    if (!device || !device.isOnline) return;
    
    const roomStateKey = room.id;
    const lastState = lastAppliedState.get(roomStateKey);
    
    // Determine target state
    const targetElectricity = isInSchedule ? (schedule.isElectricityOn || false) : false;
    const targetHeater = isInSchedule ? (schedule.isHeaterOn || false) : false;
    
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
    const currentElectricity = device.electricityStatus || false;
    const currentHeater = device.heatingStatus || false;
    
    // Only send commands if target state differs from current state
    if (currentElectricity !== targetElectricity) {
        eventHandler.emit('toggle-electricity', {
            deviceId: device.id,
            electricityStatus: targetElectricity
        });
    }
    
    if (currentHeater !== targetHeater) {
        eventHandler.emit('toggle-heating', {
            deviceId: device.id,
            heatingStatus: targetHeater
        });
    }
    
    // Update last applied state
    lastAppliedState.set(roomStateKey, {
        electricityOn: targetElectricity,
        heaterOn: targetHeater,
        isInSchedule: isInSchedule
    });
}

// Check and apply schedules
const checkSchedules = () => {
    const now = new Date();
    const dayOfWeek = getDayOfWeek(now);
    
    const rooms = getAllRooms();
    
    rooms.forEach(room => {
        if (!room.openHours || room.openHours.length === 0) {
            // No schedule - ensure we track this
            const roomStateKey = room.id;
            const lastState = lastAppliedState.get(roomStateKey);
            if (lastState && lastState.isInSchedule) {
                // Was in schedule, now no schedule - turn off
                if (room.device && room.device.isOnline) {
                    eventHandler.emit('toggle-electricity', {
                        deviceId: room.device.id,
                        electricityStatus: false
                    });
                    eventHandler.emit('toggle-heating', {
                        deviceId: room.device.id,
                        heatingStatus: false
                    });
                }
                lastAppliedState.set(roomStateKey, {
                    electricityOn: false,
                    heaterOn: false,
                    isInSchedule: false
                });
            }
            return;
        }
        
        // Find today's schedule
        const todaySchedule = room.openHours.find(
            (oh: any) => oh.dayOfWeek === dayOfWeek
        );
        
        if (!todaySchedule) {
            // No schedule for today - turn off if was in schedule
            const roomStateKey = room.id;
            const lastState = lastAppliedState.get(roomStateKey);
            if (lastState && lastState.isInSchedule) {
                if (room.device && room.device.isOnline) {
                    eventHandler.emit('toggle-electricity', {
                        deviceId: room.device.id,
                        electricityStatus: false
                    });
                    eventHandler.emit('toggle-heating', {
                        deviceId: room.device.id,
                        heatingStatus: false
                    });
                }
                lastAppliedState.set(roomStateKey, {
                    electricityOn: false,
                    heaterOn: false,
                    isInSchedule: false
                });
            }
            return;
        }
        
        // Check if current time is within schedule
        const isInSchedule = isBetween(now, todaySchedule.openHour, todaySchedule.closeHour);
        
        // Apply schedule
        applySchedule({
            roomId: room.id,
            dayOfWeek: todaySchedule.dayOfWeek,
            openHour: todaySchedule.openHour,
            closeHour: todaySchedule.closeHour,
            isElectricityOn: todaySchedule.isElectricityOn || false,
            isHeaterOn: todaySchedule.isHeaterOn || false
        }, isInSchedule);
    });
}

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
}

