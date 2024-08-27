import {NextFunction, Request, Response} from 'express';
import jwt from "jsonwebtoken";
import {UserWithRoleAndPrivileges} from "db";


export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({message: 'unauthorized'});
    }
    try {
        const data = jwt.decode(token, {
            json: true,
        });
        if (!data) {
            return res.status(401).json({message: 'unauthorized'});
        }

        const tokenUser = data.user as UserWithRoleAndPrivileges | undefined;
        if (!tokenUser) {
            return res.status(401).json({message: 'unauthorized'});
        }
        req.user = tokenUser;
        next();
    } catch (e) {
        return res.status(401).json({message: 'unauthorized'});
    }
}