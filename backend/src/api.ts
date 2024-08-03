import express from 'express';
import db from "../prisma/prisma";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/',async (req, res) =>  {

    res.send('Merhaba Dünya!');
});


export default app;