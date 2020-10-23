import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize from "../api/authorize";
import Post from "../data/post";

export const PostsRouter = (db: DbContext) => {
    const posts = express.Router();

    type PostAssignableRequest = express.Request & Partial<{post: Post}>;

    posts.param("postId", (req: PostAssignableRequest, res, next, id) => {
        const post = db.post(id);

        if (post === null) {
            respond(res, 404, `No post with postId '${id}'`);
            return;
        }

        req.post = post;

        next();
    });

    posts.get("/", (req, res) => {
        res.json(db.posts());
    });

    posts.get("/:postId", (req: PostAssignableRequest, res) => {
        res.json(req.post);
    });

    posts.post("/", (req, res) => {
        const b = req.body;

        if (
        typeof b.userId !== "string" ||
        typeof b.title !== "string" ||
        typeof b.content !== "string" ||
        typeof b.headerImage !== "string") {
            respond(res, 400, "The request body needs 'postId', 'userId', 'title', 'content', and 'headerImage' keys.");
            return;
        }

        const r = db.addPost(b);
        respond(res, 201, `Post created.`);
    });

    posts.use(authorize(db));

    posts.patch("/:postId", (req: PostAssignableRequest, res) => {
        const r = db.updatePost({...req.body, postId: req.post!.postId});
        if (!r) {
            respond(res, 404, `Post '${req.post!.postId}' does not exist.`);
            return;
        }
        respond(res, 200, `Post '${req.post!.postId}' updated`);
    });

    posts.delete("/:postId", (req: PostAssignableRequest, res) => {
        const r = db.deletePost(req.post!.postId);
        if (!r) {
            respond(res, 404, `Post '${req.post!.postId}' does not exist.`);
            return;
        }
        respond(res, 204, `Post '${req.post!.postId}' deleted`);
    });

    return posts;
}

export default PostsRouter;