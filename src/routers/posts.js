"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
exports.PostsRouter = (db) => {
    const posts = express_1.default.Router();
    posts.param("postId", (req, res, next, id) => {
        const post = db.post(id);
        if (post === null) {
            respond_1.default(res, 404, `No post with postId '${id}'`);
            return;
        }
        req.post = post;
        next();
    });
    posts.get("/", (req, res) => {
        res.json(db.posts());
    });
    posts.get("/:postId", (req, res) => {
        res.json(req.post);
    });
    posts.post("/", (req, res) => {
        const b = req.body;
        if (typeof b.userId !== "string" ||
            typeof b.title !== "string" ||
            typeof b.content !== "string" ||
            typeof b.headerImage !== "string") {
            respond_1.default(res, 400, "The request body needs 'postId', 'userId', 'title', 'content', and 'headerImage' keys.");
            return;
        }
        const r = db.addPost(b);
        respond_1.default(res, 201, `Post created.`);
    });
    posts.use(authorize_1.default(db));
    posts.patch("/:postId", (req, res) => {
        const r = db.updatePost({ ...req.body, postId: req.post.postId });
        if (!r) {
            respond_1.default(res, 404, `Post '${req.post.postId}' does not exist.`);
            return;
        }
        respond_1.default(res, 200, `Post '${req.post.postId}' updated`);
    });
    posts.delete("/:postId", (req, res) => {
        const r = db.deletePost(req.post.postId);
        if (!r) {
            respond_1.default(res, 404, `Post '${req.post.postId}' does not exist.`);
            return;
        }
        respond_1.default(res, 204, `Post '${req.post.postId}' deleted`);
    });
    return posts;
};
exports.default = exports.PostsRouter;
