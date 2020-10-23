import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize, { AuthAssignableRequest } from "../api/authorize";
import Category from "../data/category";
import Post from "../data/post";
import User from "../data/user";

export const PostCategoriesRouter = (db: DbContext) => {
    const comments = express.Router();

    type PostCategoryAssignableRequest = express.Request & Partial<{post: Post, user: User, category: Category}>;

    comments.param("postId", (req: PostCategoryAssignableRequest, res, next, id) => {
        const post = db.post(id);

        if (post === null) {
            respond(res, 404, `No post with postId '${id}'`);
            return;
        }

        req.post = post;

        const user = db.user(post.userId);

        if (user === null) {
            respond(res, 500, `No user with userId '${id}'`);
            return;
        }

        req.user = user;

        next();
    });

    comments.param("categoryId", (req: PostCategoryAssignableRequest, res, next, id) => {
        const category = db.category(id);

        if (category === null) {
            respond(res, 404, `No category with categoryId '${id}'`);
            return;
        }

        req.category = category;

        next();
    });

    comments.get("/:postId", (req: PostCategoryAssignableRequest, res) => {
        res.json(db.postCategories(req.post!.postId));
    });

    comments.get("/Posts/:categoryId", (req: PostCategoryAssignableRequest, res) => {
        res.json(db.categoryPosts(req.category!.categoryId));
    });

    comments.use(authorize(db));

    comments.post("/:postId/:categoryId", (req: PostCategoryAssignableRequest & AuthAssignableRequest, res) => {
        if (req.auth!.id !== req.user!.userId) {
            respond(res, 403, `User '${req.auth!.id}' does not have permission to modify this post.`);
            return;
        }

        const r = db.addPostCategory({postId: req.post!.postId, categoryId: req.category!.categoryId});
        if (!r) {
            respond(res, 200, `This post category already exists.`);
        }
        respond(res, 201, `Comment created.`);
    });

    comments.delete("/:postId/:categoryId", (req: PostCategoryAssignableRequest & AuthAssignableRequest, res) => {
        if (req.auth!.id !== req.user!.userId) {
            respond(res, 403, `User '${req.auth!.id}' does not have permission to modify this post.`);
            return;
        }

        const r = db.deletePostCategory(req.post!.postId, req.category!.categoryId);

        if (!r) {
            respond(res, 404, `Comment '${req.category!.categoryId}' does not exist.`);
            return;
        }
        respond(res, 204, `Comment '${req.category!.categoryId}' deleted`);
    });

    return comments;
}

export default CommentsRouter;