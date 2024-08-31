import express from "express";
import db from "db";
import authMiddleware from "../middlewares/auth-middleware";
import {canAction} from "@/helpers/utils";


const router = express.Router();

router.use(authMiddleware)

router.get("/:id", async (req, res) => {
    const {id} = req.params;
    const device = await db.device.findUnique({where: {id}});
    if (!device) {
        return res.status(404).json({error: "Device not found"});
    }
    return res.json({
        message: "Device found",
        data: device
    });

});

router.put("/:id", async (req, res) => {
    const requiredPrivileges = ['device.update', 'room.all.read', 'room.user.read'];
    const {id} = req.params;

    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Forbidden"});

    const device = await db.device.findUnique({
        where: {id}, include: {
            room: {
                include: {
                    users: true
                }
            }
        }
    });
    if (!canAction(requestingUser, ['device.all.update', 'room.all.read'])) {
        if (!device?.room?.users.find(user => user.id === requestingUser.id)) {
            return res.status(403).json({message: "Forbidden"});
        }
    }

    const {roomId, hasElectricityControl, hasHeaterControl, hasWindowSensor} = req.body;

    console.log({
        roomId, hasElectricityControl, hasHeaterControl, hasWindowSensor

    })
//     some data can be undefined, so we need to check if it is defined
    const dataToUpdate = {
        roomId: roomId ?? undefined,
        hasElectricityControl: hasElectricityControl ?? undefined,
        hasHeaterControl: hasHeaterControl ?? undefined,
        hasWindowSensor: hasWindowSensor ?? undefined
    }

    const updatedDevice = await db.device.update({
        where: {id},
        data: dataToUpdate
    });

    return res.json({
        message: "Device updated",
        data: updatedDevice
    });
})


router.get("/", async (req, res) => {
    const requiredPrivileges = ['device.read', 'room.all.create'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});
    const hasPrivileges = canAction(req.user, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});


    const devices = await db.device.findMany();
    return res.json({
        message: "Devices found",
        data: devices
    });
});

export default router;
