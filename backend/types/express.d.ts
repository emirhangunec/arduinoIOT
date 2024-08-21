import {Request as ExpressRequest} from "express";

import {UserWithRoleAndPrivileges} from "../prisma/prisma";


declare module Express {
    interface Request extends ExpressRequest {
        user?: UserWithRoleAndPrivileges ;
    }

}
declare module 'express-serve-static-core' {
    interface Request {
        user?:UserWithRoleAndPrivileges ;
    }
}
declare module "express-session" {
    interface SessionData {
        user: UserWithRoleAndPrivileges;
    }
}