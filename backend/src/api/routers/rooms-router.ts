import express from "express";
import {RoomWithOpenHoursAndDeviceAndUsers} from "db";
import {getAllRooms, getRoomById, updateRoomOpenHours} from "@/mock-data";

const router = express.Router();

// Demo mode: no auth middleware

router.get("/", async (req, res) => {
    const rooms = getAllRooms();
    return res.json({
        message: "Rooms found",
        data: rooms
    });
});

router.get("/:id", async (req, res) => {
    const {id} = req.params;
    const room = getRoomById(id);
    if (!room) {
        return res.status(404).json({error: "Room not found"});
    }
    return res.json({
        message: "Room found",
        data: room
    });
});

router.put("/:id", async (req, res) => {
    const {id} = req.params;
    const {openHours} = req.body;
    
    if (!openHours || !Array.isArray(openHours)) {
        return res.status(400).json({error: "openHours must be an array"});
    }
    
    const success = updateRoomOpenHours(id, openHours);
    if (!success) {
        return res.status(404).json({error: "Room not found"});
    }
    
    const room = getRoomById(id);
    return res.json({
        message: "Room updated",
        data: room
    });
});

export default router;
