import {Request as ExpressRequest} from "express";
import {User} from "@prisma/client";

type UserWithoutPassword = Omit<User, 'password'>;
declare module Express {
    interface Request extends ExpressRequest {
        user?: UserWithoutPassword;
    }

}
declare module 'express-serve-static-core' {
    interface Request {
        user?: UserWithoutPassword;
    }
}
declare module "express-session" {
    interface SessionData {
        user: UserWithoutPassword;
    }
}