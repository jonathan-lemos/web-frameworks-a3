"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
const errorResult_1 = __importDefault(require("../api/errorResult"));
exports.PostsRouter = (db) => {
    const posts = express_1.default.Router();
    posts.param("postId", (req, res, next, id) => {
        const post = db.post(id);
        if (post instanceof errorResult_1.default) {
            respond_1.default(res, 404, `No post with postId '${id}'`);
            return;
        }
        req.post = post;
        next();
    });
    posts.get("/", (req, res) => {
        const r = db.posts();
        if (r instanceof errorResult_1.default) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });
    posts.get("/:postId", (req, res) => {
        res.json(req.post);
    });
    posts.use(authorize_1.default(db));
    posts.post("/", (req, res) => {
        const b = req.body;
        if (typeof b.title !== "string" ||
            typeof b.content !== "string" ||
            typeof b.headerImage !== "string") {
            respond_1.default(res, 400, "The request body needs 'postId', 'title', 'content', and 'headerImage' keys.");
            return;
        }
        if (b.title === "" || b.content === "") {
            respond_1.default(res, 400, "The title and content cannot be blank.");
            return;
        }
        const d = new Date();
        const r = db.addPost({ ...b, userId: req.auth.id, lastUpdated: d, createdDate: d });
        if (!(r instanceof errorResult_1.default)) {
            respond_1.default(res, 201, `Post created.`);
        }
        else {
            respond_1.default(res, 400, r.error);
        }
    });
    posts.patch("/:postId", (req, res) => {
        const r = db.updatePost({ ...req.body, postId: req.post.postId });
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 200, `Post '${req.post.postId}' updated`);
    });
    posts.delete("/:postId", (req, res) => {
        const r = db.deletePost(req.post.postId);
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 204, `Post '${req.post.postId}' deleted`);
    });
    return posts;
};
exports.default = exports.PostsRouter;
//# sourceMappingURL=posts.js.map