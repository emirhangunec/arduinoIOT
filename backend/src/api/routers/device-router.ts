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
