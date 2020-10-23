"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostCategoriesRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
exports.PostCategoriesRouter = (db) => {
    const comments = express_1.default.Router();
    comments.param("postId", (req, res, next, id) => {
        const post = db.post(id);
        if (post === null) {
            respond_1.default(res, 404, `No post with postId '${id}'`);
            return;
        }
        req.post = post;
        const user = db.user(post.userId);
        if (user === null) {
            respond_1.default(res, 500, `No user with userId '${id}'`);
            return;
        }
        req.user = user;
        next();
    });
    comments.param("categoryId", (req, res, next, id) => {
        const category = db.category(id);
        if (category === null) {
            respond_1.default(res, 404, `No category with categoryId '${id}'`);
            return;
        }
        req.category = category;
        next();
    });
    comments.get("/:postId", (req, res) => {
        res.json(db.postCategories(req.post.postId));
    });
    comments.get("/Posts/:categoryId", (req, res) => {
        res.json(db.categoryPosts(req.category.categoryId));
    });
    comments.use(authorize_1.default(db));
    comments.post("/:postId/:categoryId", (req, res) => {
        if (req.auth.id !== req.user.userId) {
            respond_1.default(res, 403, `User '${req.auth.id}' does not have permission to modify this post.`);
            return;
        }
        const r = db.addPostCategory({ postId: req.post.postId, categoryId: req.category.categoryId });
        if (!r) {
            respond_1.default(res, 200, `This post category already exists.`);
        }
        respond_1.default(res, 201, `Comment created.`);
    });
    comments.delete("/:postId/:categoryId", (req, res) => {
        if (req.auth.id !== req.user.userId) {
            respond_1.default(res, 403, `User '${req.auth.id}' does not have permission to modify this post.`);
            return;
        }
        const r = db.deletePostCategory(req.post.postId, req.category.categoryId);
        if (!r) {
            respond_1.default(res, 404, `Comment '${req.category.categoryId}' does not exist.`);
            return;
        }
        respond_1.default(res, 204, `Comment '${req.category.categoryId}' deleted`);
    });
    return comments;
};
exports.default = CommentsRouter;
