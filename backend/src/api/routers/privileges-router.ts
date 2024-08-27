import express from "express";
import db from "db";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get('/', async (req, res) => {
    const privileges = await db.privilege.findMany();
    res.json({
        message: `${privileges.length} privileges found`,
        data: privileges
    });
});


export default router;