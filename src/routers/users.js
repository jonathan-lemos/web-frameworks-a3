"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
exports.UsersRouter = (db) => {
    const users = express_1.default.Router();
    users.param("userId", (req, res, next, id) => {
        const user = db.user(id);
        if (user === null) {
            respond_1.default(res, 404, `No user with userId '${id}'`);
            return;
        }
        req.user = user;
        next();
    });
    users.get("/", (req, res) => {
        res.json(db.users());
    });
    users.get("/:userId", (req, res) => {
        res.json(req.user);
    });
    users.post("/", async (req, res) => {
        const b = req.body;
        if (typeof b.userId !== "string" ||
            typeof b.firstName !== "string" ||
            typeof b.lastName !== "string" ||
            typeof b.emailAddress !== "string" ||
            typeof b.password !== "string") {
            respond_1.default(res, 400, "The request body needs 'userId', 'firstName', 'lastName', 'emailAddress', and 'password' keys.");
            return;
        }
        const r = await db.addUser(b);
        if (!r) {
            respond_1.default(res, 409, `A user with id '${b.userId}' already exists.`);
            return;
        }
        respond_1.default(res, 201, `User '${b.userId}' created.`);
    });
    users.get("/:id/:password", async (req, res) => {
        const t = await db.authenticateUser(req.params.id, req.params.password);
        if (t === null) {
            respond_1.default(res, 401);
            return;
        }
        res.cookie("X-Auth-Token", t);
        respond_1.default(res, 200, t);
    });
    users.use(authorize_1.default(db));
    users.patch("/:userId", async (req, res) => {
        const r = await db.updateUser({ ...req.body, userId: req.user.userId });
        if (!r) {
            respond_1.default(res, 404, `User '${req.user.userId}' does not exist.`);
            return;
        }
        respond_1.default(res, 200, `User '${req.user.userId}' updated`);
    });
    users.delete("/:userId", async (req, res) => {
        const r = await db.deleteUser(req.user.userId);
        if (!r) {
            respond_1.default(res, 404, `User '${req.user.userId}`);
            return;
        }
        respond_1.default(res, 204, `User '${req.user.userId}' deleted`);
    });
    return users;
};
exports.default = exports.UsersRouter;
