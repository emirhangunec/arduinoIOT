import express from "express";
import db, {UserWithRoleAndPrivileges} from "../../../prisma/prisma";
import authMiddleware from "../middlewares/auth-middleware";


const router = express.Router();

router.use(authMiddleware)

router.get('/', async (req, res) => {
    const requiredPrivileges = ['user.read'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const users = await db.user.findMany({
        include: {
            role: {
                include: {
                    privileges: true
                }
            }
        }

    });


    const usersWithoutPassword = users.map(u => {
        const {password, ...user} = u;
        return user as UserWithRoleAndPrivileges
    })


    res.json({
        message: `${usersWithoutPassword.length} users found`,
        data: usersWithoutPassword
    });
});

router.post('/', async (req, res) => {
    const requiredPrivileges = ['user.create', 'role.read'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {name, email, password, roleId} = req.body;

    if (!name || !email || !password || !roleId) return res.status(400).json({message: 'missing fields'});

    if (roleId === '1') {
        return res.status(403).json({message: 'forbidden'});
    }


    const existingUser = await db.user.findFirst({
        where: {
            email
        }
    });

    if (existingUser) return res.status(422).json({message: 'user already exists'});

    const user = await db.user.create({
        data: {
            name,
            email,
            password,
            role: {
                connect: {
                    id: roleId
                }
            }
        }
    });

    const {password: _, ...userWithoutPassword} = user;

    res.json({
        message: 'user created',
        data: userWithoutPassword
    });


})

router.put('/:id', async (req, res) => {
    const requiredPrivileges = ['user.update', 'role.read'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {name, email, roleId} = req.body;
    const {id} = req.params;

    if (!name || !email || !roleId) return res.status(400).json({message: 'missing fields'});

    const userToBeEdited = await db.user.findUnique({
        where: {
            id: id
        },
    });

    if (!userToBeEdited) return res.status(404).json({message: 'user not found'});

    if (roleId === '1' && userToBeEdited.roleId !== '1') {
        return res.status(403).json({message: 'forbidden'});
    }

    if (roleId !== '1' && userToBeEdited.roleId === '1') {
        return res.status(403).json({message: 'forbidden'});
    }

    const newUser = await db.user.update({
        where: {
            id
        },
        data: {
            name,
            email,
            role: {
                connect: {
                    id: roleId
                }
            }
        }
    });

    res.json({
        message: 'user updated',
        data: newUser
    });


})

router.delete('/:id', async (req, res) => {
    const requiredPrivileges = ['user.delete'];
    if (!req.user) return res.status(401).json({message: 'unauthorized'});

    const requestingUserPrivileges = req.user.role.privileges.map(p => p.name);
    const hasPrivileges = requiredPrivileges.every(p => requestingUserPrivileges.includes(p));
    if (!hasPrivileges) return res.status(403).json({message: 'forbidden'});

    const {id} = req.params;

    const userToBeDeleted = await db.user.findUnique({
        where: {
            id
        }
    });

    if (!userToBeDeleted) return res.status(404).json({message: 'user not found'});

    if (userToBeDeleted.roleId === '1') {
        return res.status(403).json({message: 'forbidden'});
    }

    const deletedUser = await db.user.delete({
        where: {
            id
        }
    });

    const {password: _, ...userWithoutPassword} = deletedUser;

    res.json({
        message: 'user deleted',
        data: userWithoutPassword
    });


})
export default router;