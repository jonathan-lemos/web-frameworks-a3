import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize, { AuthAssignableRequest } from "../api/authorize";
import Post from "../data/post";
import ErrorResult from "../api/errorResult";

export const PostsRouter = (db: DbContext) => {
    const posts = express.Router();

    type PostAssignableRequest = express.Request & Partial<{post: Post}>;

    posts.param("postId", (req: PostAssignableRequest, res, next, id) => {
        const post = db.post(id);

        if (post instanceof ErrorResult) {
            respond(res, 404, `No post with postId '${id}'`);
            return;
        }

        req.post = post;

        next();
    });

    posts.get("/", (req, res) => {
        const r = db.posts();
        if (r instanceof ErrorResult) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });

    posts.get("/:postId", (req: PostAssignableRequest, res) => {
        res.json(req.post);
    });

    posts.use(authorize(db));

    posts.post("/", (req: AuthAssignableRequest, res) => {
        const b = req.body;

        if (
        typeof b.title !== "string" ||
        typeof b.content !== "string" ||
        typeof b.headerImage !== "string") {
            respond(res, 400, "The request body needs 'postId', 'title', 'content', and 'headerImage' keys.");
            return;
        }

        if (b.title === "" || b.content === "") {
            respond(res, 400, "The title and content cannot be blank.");
            return;
        }

        const d = new Date();

        const r = db.addPost({...b, userId: req.auth!.id, lastUpdated: d, createdDate: d});

        if (!(r instanceof ErrorResult)) {
            respond(res, 201, `Post created.`);
        }
        else {
            respond(res, 400, r.error);
        }
    });

    posts.patch("/:postId", (req: PostAssignableRequest, res) => {
        const r = db.updatePost({...req.body, postId: req.post!.postId});
        if (r instanceof ErrorResult) {
            respond(res, 404, r.error);
            return;
        }
        respond(res, 200, `Post '${req.post!.postId}' updated`);
    });

    posts.delete("/:postId", (req: PostAssignableRequest, res) => {
        const r = db.deletePost(req.post!.postId);
        if (r instanceof ErrorResult) {
            respond(res, 404, r.error);
            return;
        }
        respond(res, 204, `Post '${req.post!.postId}' deleted`);
    });

    return posts;
}

export default PostsRouter;