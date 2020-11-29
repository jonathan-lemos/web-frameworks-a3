"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
const errorResult_1 = __importDefault(require("../api/errorResult"));
exports.CommentsRouter = (db) => {
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
    comments.param("commentId", (req, res, next, id) => {
        const comment = db.comment(req.post.postId, id);
        if (comment instanceof errorResult_1.default) {
            respond_1.default(res, 404, comment.error);
            return;
        }
        req.comment = comment;
        next();
    });
    comments.get("/:postId", (req, res) => {
        const r = db.comments(req.post.postId);
        res.status(r instanceof errorResult_1.default ? 500 : 200);
        res.json(r instanceof errorResult_1.default ? r.error : r);
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
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 500, r.error);
        }
        else {
            respond_1.default(res, 201, `Comment created.`);
        }
    });
    comments.patch("/:postId/:commentId", (req, res) => {
        if (typeof req.body.content !== "string") {
            respond_1.default(res, 400, `No 'content' given in post body.`);
            return;
        }
        const r = db.updateComment(req.user.userId, req.post.postId, req.comment.commentId, req.body.content);
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
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
        if (r instanceof errorResult_1.default) {
            respond_1.default(res, 404, r.error);
            return;
        }
        respond_1.default(res, 204, `Comment '${req.comment.commentId}' deleted`);
    });
    return comments;
};
exports.default = exports.CommentsRouter;
//# sourceMappingURL=comments.js.map