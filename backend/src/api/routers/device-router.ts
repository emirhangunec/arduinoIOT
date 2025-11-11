import express from "express";
import {getDeviceById, updateDeviceStatus} from "@/mock-data";

const router = express.Router();

// Demo mode: no auth middleware

router.get("/", async (req, res) => {
    // Return all devices from mock data
    const {getOnlineDevices} = await import('@/mock-data');
    const devices = getOnlineDevices();
    return res.json({
        message: "Devices found",
        data: devices
    });
});

router.get("/:id", async (req, res) => {
    const {id} = req.params;
    const device = getDeviceById(id);
    if (!device) {
        return res.status(404).json({error: "Device not found"});
    }
    return res.json({
        message: "Device found",
        data: device
    });
});

router.put("/:id", async (req, res) => {
    const {id} = req.params;
    const {roomId, hasElectricityControl, hasHeaterControl, hasWindowSensor} = req.body;
    
    const device = getDeviceById(id);
    if (!device) {
        return res.status(404).json({error: "Device not found"});
    }
    
    const dataToUpdate: any = {};
    if (roomId !== undefined) dataToUpdate.roomId = roomId;
    if (hasElectricityControl !== undefined) dataToUpdate.hasElectricityControl = hasElectricityControl;
    if (hasHeaterControl !== undefined) dataToUpdate.hasHeaterControl = hasHeaterControl;
    if (hasWindowSensor !== undefined) dataToUpdate.hasWindowSensor = hasWindowSensor;
    
    const updatedDevice = updateDeviceStatus(id, dataToUpdate);
    if (!updatedDevice) {
        return res.status(500).json({error: "Failed to update device"});
    }
    
    return res.json({
        message: "Device updated",
        data: updatedDevice
    });
});

export default router;
