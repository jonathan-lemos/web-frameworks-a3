"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostCategoriesRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
const errorResult_1 = __importDefault(require("../api/errorResult"));
exports.PostCategoriesRouter = (db) => {
    const comments = express_1.default.Router();
    comments.param("postId", (req, res, next, id) => {
        const post = db.post(id);
        if (post instanceof errorResult_1.default) {
            respond_1.default(res, 404, post.error);
            return;
        }
        req.post = post;
        const user = db.user(post.userId);
        if (user instanceof errorResult_1.default) {
            respond_1.default(res, 500, `Could not find posting user: ${user.error}`);
            return;
        }
        req.user = user;
        next();
    });
    comments.param("categoryId", (req, res, next, id) => {
        const category = db.category(id);
        if (category instanceof errorResult_1.default) {
            respond_1.default(res, 404, category.error);
            return;
        }
        req.category = category;
        next();
    });
    comments.get("/:postId", (req, res) => {
        const r = db.postCategories(req.post.postId);
        if (r instanceof errorResult_1.default) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });
    comments.get("/Posts/:categoryId", (req, res) => {
        const r = db.categoryPosts(req.category.categoryId);
        if (r instanceof errorResult_1.default) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });
    comments.use(authorize_1.default(db));
    comments.post("/:postId/:categoryId", (req, res) => {
        if (req.auth.id !== req.user.userId) {
            respond_1.default(res, 403, `User '${req.auth.id}' does not have permission to modify this post.`);
            return;
        }
        const r = db.addPostCategory({ postId: req.post.postId, categoryId: req.category.categoryId });
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 200, r.error);
        }
        else {
            respond_1.default(res, 201, `Post linked with category.`);
        }
    });
    comments.delete("/:postId/:categoryId", (req, res) => {
        if (req.auth.id !== req.user.userId) {
            respond_1.default(res, 403, `User '${req.auth.id}' does not have permission to modify this post.`);
            return;
        }
        const r = db.deletePostCategory(req.post.postId, req.category.categoryId);
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 204, `Comment '${req.category.categoryId}' deleted`);
    });
    return comments;
};
exports.default = exports.PostCategoriesRouter;
//# sourceMappingURL=post-categories.js.map