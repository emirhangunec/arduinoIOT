import express from "express";
import db, {RoomWithOpenHoursAndDeviceAndUsers} from "db";
import authMiddleware from "../middlewares/auth-middleware";
import {canAction} from "@/helpers/utils";


const router = express.Router();

router.use(authMiddleware)

router.get("/:id", async (req, res) => {
    const requiredPrivileges = ['room.all.read', 'room.user.read'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});
    const hasPrivileges = requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});
    const {id} = req.params;
    const room = await db.room.findUnique({where: {id}, include: {openHours: true}});
    if (!room) {
        return res.status(404).json({error: "Room not found"});
    }
    return res.json({
        message: "Room found",
        data: room
    });

});

router.get("/", async (req, res) => {
    const requiredPrivileges = ['room.all.read'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});

    const searchParams = req.query;

    if (searchParams.all?.toString() === "true") {
        if (!canAction(requestingUser, 'room.all.read')) return res.status(403).json({message: "Unauthorized"});

        const rooms = await db.room.findMany({
            include: {
                openHours: true,
                device: true,
                users: true
            }
        }) as RoomWithOpenHoursAndDeviceAndUsers[];
        return res.json({
            message: "Rooms found",
            data: rooms
        });
    }

    if (searchParams.user?.toString() === "true") {
        if (!canAction(requestingUser, 'room.user.read')) return res.status(403).json({message: "Unauthorized"});

        const requestingUserId = requestingUser.id;
        const rooms = await db.room.findMany({
            where: {
                users: {
                    some: {
                        id: requestingUserId
                    }
                }
            },
            include: {
                openHours: true,
                device: true,
                users: true
            }
        }) as RoomWithOpenHoursAndDeviceAndUsers[];

        return res.json({
            message: "Rooms found",
            data: rooms
        });
    }

});

router.post("/", async (req, res) => {
    const requiredPrivileges = ['room.all.create'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});

    const {name, doorNumber, floor, sector, openHours, deviceId, userIds} = req.body;

    if (!name) {
        return res.status(400).json({message: "Missing required fields"});
    }



    const room = await db.room.create({
        data: {
            name,
            doorNumber,
            floor,
            sector,
            openHours: {
                create: openHours
            },
            device: {
                connect: deviceId ? {id: deviceId} : undefined
            },
            users: {
                connect: userIds.map((id: string) => ({id}))
            }
        },
        include: {
            openHours: true,
            device: true,
            users: {
                include: {
                    role: {
                        include: {
                            privileges: true
                        }
                    }
                }
            }
        }
    });

    return res.json({
        message: "Room created",
        data: room
    });
})

export default router;