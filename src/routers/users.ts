import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import User from "../data/user";
import authorize from "../api/authorize";
import bodyPrepare from "../api/bodyPrepare";
import ErrorResult from "../api/errorResult";

export const UsersRouter = (db: DbContext) => {
    const users = express.Router();

    type UserAssignableRequest = express.Request & Partial<{user: User}>;

    type UserRequest = express.Request & Partial<{user: User}>;

    users.param("userId", (req: UserAssignableRequest, res, next, id) => {
        const user = db.user(id);

        if (user instanceof ErrorResult) {
            respond(res, 404, user.error);
            return;
        }

        req.user = user;

        next();
    });

    users.post("/", async (req, res) => {
        const b = bodyPrepare(req.body, ["userId", "firstName", "lastName", "emailAddress", "password"]);
        
        if (b instanceof ErrorResult) {
            res.status(400);
            res.json({"status": 400, ...b.error});
            return;
        }

        const r = await db.addUser(b as any);

        if (r instanceof ErrorResult) {
            res.status(409);
            res.json({"status": 409, "error": r.error});
            return;
        }

        res.status(201);
        res.json({status: 201, userId: b.userId, firstName: b.firstName, lastName: b.lastName, emailAddress: b.emailAddress});
    });

    users.get("/:id/:password", async (req, res) => {
        const t = await db.authenticateUser(req.params.id, req.params.password);
        if (t instanceof ErrorResult) {
            respond(res, 401, t.error);
            return;
        }

        res.cookie("X-Auth-Token", t, {secure: true, httpOnly: true});
        res.setHeader("Authorization", `Bearer ${t}`)
        res.status(200);
        res.json({"status": 200, "token": t});
    });

    users.use(authorize(db));

    users.get("/", (req, res) => {
        const r = db.users();
        if (r instanceof ErrorResult) {
            respond(res, 500, r.error);
        }
        else {
            res.json(r);
        }
    });

    users.get("/:userId", (req: UserRequest, res) => {
        res.json(req.user);
    });

    users.get("/Posts/:userId", async (req: UserRequest, res) => {
        res.json(db.userPosts(req.user!.userId));
    });

    users.patch("/:userId", async (req: UserRequest, res) => {
        const r = await db.updateUser({ ...req.body, userId: req.user!.userId });
        if (r instanceof ErrorResult) {
            respond(res, 404, r.error);
            return;
        }
        respond(res, 200, `User '${req.user!.userId}' updated`);
    });

    users.delete("/:userId", async (req: UserRequest, res) => {
        const r = await db.deleteUser(req.user!.userId);
        if (r instanceof ErrorResult) {
            respond(res, 404, r.error);
            return;
        }
        respond(res, 204, `User '${req.user!.userId}' deleted`);
    });

    return users;
}

export default UsersRouter;