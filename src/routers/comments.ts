import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize, { AuthAssignableRequest } from "../api/authorize";
import Comment from "../data/comment";
import Post from "../data/post";
import User from "../data/user";
import ErrorResult from "../api/errorResult";

export const CommentsRouter = (db: DbContext) => {
    const comments = express.Router();

    type CommentAssignableRequest = express.Request & Partial<{post: Post, user: User, comment: Comment}>;

    comments.param("postId", (req: CommentAssignableRequest, res, next, id) => {
        const post = db.post(id);

        if (post === null) {
            respond(res, 404, `No post with postId '${id}'`);
            return;
        }

        req.post = post;

        const user = db.user(post.userId);

        if (user instanceof ErrorResult) {
            respond(res, 500, `Could not find posting user: ${user.error}`);
            return;
        }

        req.user = user;

        next();
    });

    comments.param("commentId", (req: CommentAssignableRequest, res, next, id) => {
        const comment = db.comment(req.post!.postId, id);

        if (comment === null) {
            respond(res, 404, `No comment with commentId '${id}'`);
            return;
        }

        req.comment = comment;

        next();
    });

    comments.get("/:postId", (req: CommentAssignableRequest, res) => {
        console.log("got here");
        res.json(db.comments(req.post!.postId));
    });

    comments.get("/:postId/:commentId", (req: CommentAssignableRequest, res) => {
        res.json(req.comment);
    });

    comments.use(authorize(db));

    comments.post("/:postId", (req: CommentAssignableRequest & AuthAssignableRequest, res) => {
        const b = req.body;

        if (typeof b.userId !== "string" ||
        typeof b.comment !== "string") {
            respond(res, 400, "The request body needs  'userId', 'postId', and 'comment' keys.");
            return;
        }

        const r = db.addComment({...b, postId: req.post!.postId, commentDate: new Date()});
        respond(res, 201, `Comment created.`);
    });

    comments.patch("/:postId/:commentId", (req: CommentAssignableRequest & AuthAssignableRequest, res) => {
        if (typeof req.body.content !== "string") {
            respond(res, 400, `No 'content' given in post body.`);
            return;
        }

        const r = db.updateComment(req.user!.userId, req.post!.postId, req.comment!.commentId, req.body.content);
        if (!r) {
            respond(res, 404, `Comment '${req.comment!.commentId}' not updated.`);
            return;
        }

        respond(res, 200, `Comment '${req.comment!.commentId}' updated`);
    });

    comments.delete("/:postId/:commentId", (req: CommentAssignableRequest & AuthAssignableRequest, res) => {
        if (req.auth!.id !== req.user!.userId) {
            respond(res, 401, `User '${req.auth!.id}' does not have permission to modify this post.`);
            return;
        }

        const r = db.deleteComment(req.post!.postId, req.comment!.commentId);

        if (!r) {
            respond(res, 404, `Comment '${req.comment!.commentId}' does not exist.`);
            return;
        }
        respond(res, 204, `Comment '${req.comment!.commentId}' deleted`);
    });

    return comments;
}

export default CommentsRouter;
