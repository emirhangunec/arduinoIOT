import express from "express";
import db from "db";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get("/:id", async (req, res) => {
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

export default router;