import express from "express";
import DbContext, { AuthPayload } from "../data/database";
import respond from "./respond";

export type AuthAssignableRequest = express.Request & Partial<{auth: AuthPayload}> & Partial<{cookies: any}>;

export const authorize = (db: DbContext) => (req: AuthAssignableRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.replace(/^Bearer /, "") || (req.cookies && req.cookies["X-Auth-Token"]);

    if (!token) {
        respond(res, 401);
        return;
    }

    const r = db.decodeToken(token);

    if (r == null) {
        return r;
    }

    req.auth = r;
    
    next();
};

export default authorize;
