import express from 'express';
import db from "../prisma/prisma";
import cors from 'cors';
import {hashPassword} from "./bcrypt";

const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors())

app.get('/', async (req, res) => {

    res.json({message: 'Welcome to the API'});
});

export default app;