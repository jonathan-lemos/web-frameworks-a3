"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
const bodyPrepare_1 = __importDefault(require("../api/bodyPrepare"));
const errorResult_1 = __importDefault(require("../api/errorResult"));
exports.UsersRouter = (db) => {
    const users = express_1.default.Router();
    users.param("userId", (req, res, next, id) => {
        const user = db.user(id);
        if (user instanceof errorResult_1.default) {
            respond_1.default(res, 404, user.error);
            return;
        }
        req.user = user;
        next();
    });
    users.post("/", async (req, res) => {
        const b = bodyPrepare_1.default(req.body, ["userId", "firstName", "lastName", "emailAddress", "password"]);
        if (b instanceof errorResult_1.default) {
            res.status(400);
            res.json({ "status": 400, ...b.error });
            return;
        }
        const r = await db.addUser(b);
        if (r instanceof errorResult_1.default) {
            res.status(409);
            res.json({ "status": 409, "error": r.error });
            return;
        }
        res.status(201);
        res.json({ status: 201, userId: b.userId, firstName: b.firstName, lastName: b.lastName, emailAddress: b.emailAddress });
    });
    users.get("/:id/:password", async (req, res) => {
        if (req.params.id.toLowerCase() === "posts") {
            res.json(db.userPosts(req.params.password));
            return;
        }
        const t = await db.authenticateUser(req.params.id, req.params.password);
        if (t instanceof errorResult_1.default) {
            respond_1.default(res, 401, t.error);
            return;
        }
        res.cookie("X-Auth-Token", t, { secure: true, httpOnly: true });
        res.setHeader("Authorization", `Bearer ${t}`);
        res.status(200);
        res.json({ "status": 200, "token": t });
    });
    users.use(authorize_1.default(db));
    users.get("/", (req, res) => {
        const r = db.users();
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 500, r.error);
        }
        else {
            res.json(r);
        }
    });
    users.get("/:userId", (req, res) => {
        res.json(req.user);
    });
    users.get("/Posts/:userId", async (req, res) => {
        res.json(db.userPosts(req.user.userId));
    });
    users.patch("/:userId", async (req, res) => {
        const r = await db.updateUser({ ...req.body, userId: req.user.userId });
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 200, `User '${req.user.userId}' updated`);
    });
    users.delete("/:userId", async (req, res) => {
        const r = await db.deleteUser(req.user.userId);
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 204, `User '${req.user.userId}' deleted`);
    });
    return users;
};
exports.default = exports.UsersRouter;
//# sourceMappingURL=users.js.map