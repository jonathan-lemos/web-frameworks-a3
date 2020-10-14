import express from "express";
import DbContext, { AuthPayload } from "../data/database";
import respond from "./respond";

type AuthAssignableRequest = express.Request & Partial<{auth: AuthPayload}> & Partial<{cookies: any}>;

export const authorize = (db: DbContext) => (req: AuthAssignableRequest, res: express.Response, next: express.NextFunction) => {
    if (req.cookies == null) {
        throw new Error("Cookie parser not enabled before the authorize middleware");
    }

    if (!req.cookies["X-Auth-Token"]) {
        respond(res, 401);
        return;
    }

    const r = db.decodeToken(req.cookies["X-Auth-Token"]);

    if (r == null) {
        return r;
    }

    req.auth = r;
    
    next();
};

export default authorize;
