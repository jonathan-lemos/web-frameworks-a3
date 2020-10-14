import express from "express";
import DbContext from "../data/database";
import respond from "./respond";
import User from "../data/user";
import authorize from "./authorize";

export const UsersRouter = (db: DbContext) => {
    const users = express.Router();

    type UserAssignableRequest = express.Request & Partial<{user: User}>;

    type UserRequest = express.Request & Partial<{user: User}>;

    users.param("userId", (req: UserAssignableRequest, res, next, id) => {
        const user = db.user(id);

        if (user === null) {
            respond(res, 404, `No user with userId '${id}'`);
            return;
        }

        req.user = user;

        next();
    });

    users.get("/", (req, res) => {
        res.json(db.users());
    });

    users.get("/:userId", (req: UserRequest, res) => {
        res.json(req.user);
    });

    users.post("/", async (req, res) => {
        const b = req.body;

        if (typeof b.userId !== "string" ||
        typeof b.firstName !== "string" ||
        typeof b.lastName !== "string" ||
        typeof b.emailAddress !== "string" ||
        typeof b.password !== "string") {
            respond(res, 400, "The request body needs 'userId', 'firstName', 'lastName', 'emailAddress', and 'password' keys.");
            return;
        }

        const r = await db.addUser(b);

        if (!r) {
            respond(res, 409, `A user with id '${b.userId}' already exists.`);
            return;
        }
        respond(res, 201, `User '${b.userId}' created.`);
    });

    users.get("/:id/:password", async (req, res) => {
        const t = await db.authenticateUser(req.params.id, req.params.password);
        if (t === null) {
            respond(res, 401);
            return;
        }

        res.cookie("X-Auth-Token", t);
        respond(res, 200, "Successfully authenticated");
    });

    users.use(authorize(db));

    users.patch("/:userId", async (req: UserRequest, res) => {
        const r = await db.updateUser({...req.body, userId: req.user!.userId});
        if (!r) {
            respond(res, 404, `User '${req.body}`)
        }
        respond(res, 201, `User '${req.body}' updated}`);
    });

    users.delete("/:userId", async (req: UserRequest, res) => {
        const r = await db.deleteUser(req.user!.userId);
        if (!r) {
            respond(res, 404, `User '${req.body}`)
        }
        respond(res, 201, `User '${req.body}' updated}`);
    });

    return users;
}

export default UsersRouter;