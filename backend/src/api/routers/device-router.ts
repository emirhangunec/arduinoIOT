import express from "express";
import db from "db";
import authMiddleware from "../middlewares/auth-middleware";


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


export default router;
