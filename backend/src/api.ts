import express from 'express';
import db from "../prisma/prisma";
import cors from 'cors';
import {hashPassword} from "./bcrypt";

const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors())

app.get('/', async (req, res) => {

    const users = await db.user.findMany();
    console.log(users);
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
    console.log({
        name, email, password, companyName
    });
    let user, company;
    try {

        const hashedPassword = await hashPassword(password);

        user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isAdmin: true
            }
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

    res.json({
        message: 'setup completed return to login page to login with superadmin credentials', data: {
            user: userWithoutPassword,
            company
        }
    });

})


export default app;