import express from 'express';
import db from "db";
import cors from 'cors';
import {comparePassword, hashPassword} from "./bcrypt";
import jwt from 'jsonwebtoken';

import usersRouter from "@/api/routers/users-router";
import privilegesRouter from "@/api/routers/privileges-router";
import rolesRouter from "@/api/routers/roles-router";
import deviceRouter from "@/api/routers/device-router";
import roomsRouter from "@/api/routers/rooms-router";


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors())

app.get('/', async (req, res) => {

    res.json({message: 'api is ok and running'});
});


app.get('/company', async (req, res) => {
    const company = await db.company.findFirst();
    if (!company) {
        return res.status(404).json({message: 'company not found'});
    }
    res.json({
        message: 'company found',
        data: {company}
    });
})

app.post('/setup', async (req, res) => {
    const {name, email, password, companyName} = req.body;
    let user, company;
    try {

        const hashedPassword = await hashPassword(password);

        user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isAdmin: true,
                role: {
                    connect: {
                        id: '1'
                    }
                }
            },
            include: {
                role: {
                    include: {
                        privileges: true
                    }
                }
            },
        });


    } catch (e) {
        console.log(e);
        return res.status(500).json({message: 'something went wrong on superadmin creation'});
    }

    try {
        company = await db.company.create({
            data: {
                name: companyName
            }
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message: 'something went wrong on company creation'});
    }
    if (!user || !company) {
        return res.status(500).json({message: 'something went wrong on superadmin or company creation'});
    }

    const {password: _, ...userWithoutPassword} = user;
    const token = jwt.sign({user: userWithoutPassword}, 'mostsecuresecret');

    res.json({
        message: 'setup completed return to login page to login with superadmin credentials', data: {
            company,
            token
        }
    });

})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'email and password are required'});
    }
    const user = await db.user.findUnique({
        where: {email},
        include: {
            role: {
                include: {
                    privileges: true
                }
            }
        }
    });
    if (!user) {
        return res.status(404).json({message: 'user not found'});
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({message: 'invalid credentials'});
    }
    const {password: _, ...userWithoutPassword} = user;
    const token = jwt.sign({user: userWithoutPassword}, 'mostsecuresecret');
    res.json({message: 'login successful', data: {token}});
})

app.use('/users', usersRouter);
app.use('/privileges', privilegesRouter);
app.use('/roles', rolesRouter);
app.use('/devices', deviceRouter);
app.use('/rooms', roomsRouter);
export default app;