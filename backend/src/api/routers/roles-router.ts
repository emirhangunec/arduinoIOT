import express from "express";
import db from "db";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get('/', async (req, res) => {
    const requiredPrivileges = ['role.read'];

    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

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

    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {name, privileges} = req.body;

    if (!name || !privileges || !Array.isArray(privileges) || privileges.length === 0) return res.status(400).json({message: 'missing fields'});

    const existingRole = await db.role.findFirst({
        where: {
            name
        }
    });

    if (existingRole) return res.status(422).json({message: 'role already exists'});

    const role = await db.role.create({
        data: {
            name,
            privileges: {
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

router.put('/:id', async (req, res) => {
    const requiredPrivileges = ['role.update'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});


    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {id} = req.params;
    const {name, privileges} = req.body;

    if (!name || !privileges || !Array.isArray(privileges) || privileges.length === 0) return res.status(400).json({message: 'missing fields'});

    const existingRole = await db.role.findFirst({
        where: {
            id
        }
    });

    if (!existingRole) return res.status(404).json({message: 'role not found'});

    if (existingRole.id === '1') return res.status(403).json({message: 'cannot update default role'});

    const role = await db.role.update({
        where: {
            id
        },
        data: {
            name,
            privileges: {
                set: privileges.map((p: string) => ({id: p})),
            }
        },
        include: {
            privileges: true
        }
    });

    res.json({
        message: 'role updated',
        data: role
    });

})

router.delete('/:id', async (req, res) => {
    const requiredPrivileges = ['role.delete'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {id} = req.params;

    const existingRole = await db.role.findFirst({
        where: {
            id
        },
        include: {
            users: true
        }
    });

    if (!existingRole) return res.status(404).json({message: 'role not found'});

    if (existingRole.id === '1') return res.status(403).json({message: 'cannot delete default role'});

    if (existingRole.users.length > 0) return res.status(403).json({message: 'role has users'});

    await db.role.delete({
        where: {
            id
        }
    });

    res.json({
        message: 'role deleted'
    });
})
export default router;