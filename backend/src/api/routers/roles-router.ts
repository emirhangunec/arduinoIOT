import express from "express";
import db from "../../../prisma/prisma";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get('/', async (req, res) => {
    const requiredPrivileges = ['role.read'];

    if(!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if(!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const roles = await db.role.findMany({
        include: {
            privileges: true
        }
    });

    res.json({
        message: `${roles.length} roles found`,
        data: roles
    });
});

router.post('/', async (req, res) => {
    const requiredPrivileges = ['role.create'];

    if(!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if(!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {name, privileges} = req.body;

    if(!name || !privileges || !Array.isArray(privileges) || privileges.length === 0) return res.status(400).json({message: 'missing fields'});

    const existingRole = await db.role.findFirst({
        where: {
            name
        }
    });

    if(existingRole) return res.status(422).json({message: 'role already exists'});

    const role = await db.role.create({
        data: {
            name,
            privileges:{
                connect: privileges.map((p: string) => ({id: p})),
            }
        },
        include: {
            privileges: true
        }
    });

    res.json({
        message: 'role created',
        data: role
    });
})

export default router;