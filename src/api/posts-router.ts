import express from "express";
import DbContext from "../data/database";
import respond from "./respond";
import authorize from "./authorize";
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
        respond(res, 201, `Post '${b.userId}' created.`);
    });

    users.get("/:id/:password", async (req, res) => {
        const t = await db.authenticateUser(req.params.id, req.params.password);
        if (t === null) {
            respond(res, 401);
            return;
        }

        res.cookie("X-Auth-Token", t);
        respond(res, 200, "Successfully authenticated");
    });

    users.use(authorize(db));

    users.patch("/:userId", async (req: UserRequest, res) => {
        const r = await db.updateUser({...req.body, userId: req.user!.userId});
        if (!r) {
            respond(res, 404, `User '${req.body}`)
        }
        respond(res, 201, `User '${req.body}' updated}`);
    });

    users.delete("/:userId", async (req: UserRequest, res) => {
        const r = await db.deleteUser(req.user!.userId);
        if (!r) {
            respond(res, 404, `User '${req.body}`)
        }
        respond(res, 201, `User '${req.body}' updated}`);
    });
}

export default PostsRouter;