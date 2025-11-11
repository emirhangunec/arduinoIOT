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
    const {getCompany} = await import('./mock-data');
    const company = getCompany();
    res.json({
        message: 'company found',
        data: {company}
    });
})

// Setup endpoint removed for demo mode

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