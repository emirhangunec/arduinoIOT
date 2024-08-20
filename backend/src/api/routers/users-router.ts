import express from "express";
import db from "../../../prisma/prisma";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get('/', async (req, res) => {
    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true
        }
    });
    // @ts-ignore
    console.log('requesting user:', req.user);
    res.json(users);
});


export default router;