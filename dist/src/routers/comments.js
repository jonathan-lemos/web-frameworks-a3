"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
exports.CommentsRouter = (db) => {
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
    comments.param("commentId", (req, res, next, id) => {
        const comment = db.comment(req.post.postId, id);
        if (comment === null) {
            respond_1.default(res, 404, `No comment with commentId '${id}'`);
            return;
        }
        req.comment = comment;
        next();
    });
    comments.get("/:postId", (req, res) => {
        console.log("got here");
        res.json(db.comments(req.post.postId));
    });
    comments.get("/:postId/:commentId", (req, res) => {
        res.json(req.comment);
    });
    comments.use(authorize_1.default(db));
    comments.post("/:postId", (req, res) => {
        const b = req.body;
        if (typeof b.userId !== "string" ||
            typeof b.comment !== "string") {
            respond_1.default(res, 400, "The request body needs  'userId', 'postId', and 'comment' keys.");
            return;
        }
        const r = db.addComment({ ...b, postId: req.post.postId, commentDate: new Date() });
        respond_1.default(res, 201, `Comment created.`);
    });
    comments.patch("/:postId/:commentId", (req, res) => {
        if (typeof req.body.content !== "string") {
            respond_1.default(res, 400, `No 'content' given in post body.`);
            return;
        }
        const r = db.updateComment(req.user.userId, req.post.postId, req.comment.commentId, req.body.content);
        if (!r) {
            respond_1.default(res, 404, `Comment '${req.comment.commentId}' not updated.`);
            return;
        }
        respond_1.default(res, 200, `Comment '${req.comment.commentId}' updated`);
    });
    comments.delete("/:postId/:commentId", (req, res) => {
        if (req.auth.id !== req.user.userId) {
            respond_1.default(res, 401, `User '${req.auth.id}' does not have permission to modify this post.`);
            return;
        }
        const r = db.deleteComment(req.post.postId, req.comment.commentId);
        if (!r) {
            respond_1.default(res, 404, `Comment '${req.comment.commentId}' does not exist.`);
            return;
        }
        respond_1.default(res, 204, `Comment '${req.comment.commentId}' deleted`);
    });
    return comments;
};
exports.default = exports.CommentsRouter;
//# sourceMappingURL=comments.js.map