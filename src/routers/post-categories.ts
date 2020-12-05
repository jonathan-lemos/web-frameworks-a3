import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize, { AuthAssignableRequest } from "../api/authorize";
import Category from "../data/category";
import Post from "../data/post";
import User from "../data/user";
import ErrorResult from "../api/errorResult";

export const PostCategoriesRouter = (db: DbContext) => {
    const comments = express.Router();

    type PostCategoryAssignableRequest = express.Request & Partial<{post: Post, user: User, category: Category}>;

    comments.param("postId", (req: PostCategoryAssignableRequest, res, next, id) => {
        const post = db.post(id);

        if (post instanceof ErrorResult) {
            respond(res, 404, post.error);
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

    comments.param("categoryId", (req: PostCategoryAssignableRequest, res, next, id) => {
        const category = db.category(id);

        if (category instanceof ErrorResult) {
            respond(res, 404, category.error);
            return;
        }

        req.category = category;

        next();
    });

    comments.get("/:postId", (req: PostCategoryAssignableRequest, res) => {
        const r = db.postCategories(req.post!.postId);
        if (r instanceof ErrorResult) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });

    comments.get("/Posts/:categoryId", (req: PostCategoryAssignableRequest, res) => {
        const r = db.categoryPosts(req.category!.categoryId);
        if (r instanceof ErrorResult) {
            res.status(500);
            res.json(r.error);
        }
        else {
            res.json(r);
        }
    });

    comments.use(authorize(db));

    comments.post("/:postId/:categoryId", (req: PostCategoryAssignableRequest & AuthAssignableRequest, res) => {
        if (req.auth!.id !== req.user!.userId) {
            respond(res, 403, `User '${req.auth!.id}' does not have permission to modify this post.`);
            return;
        }

        const r = db.addPostCategory({postId: req.post!.postId, categoryId: req.category!.categoryId});
        if (r instanceof ErrorResult) {
            respond(res, 200, r.error);
        }
        else {
            respond(res, 201, `Post linked with category.`);
        }
    });

    comments.delete("/:postId/:categoryId", (req: PostCategoryAssignableRequest & AuthAssignableRequest, res) => {
        if (req.auth!.id !== req.user!.userId) {
            respond(res, 403, `User '${req.auth!.id}' does not have permission to modify this post.`);
            return;
        }

        const r = db.deletePostCategory(req.category!.categoryId, req.post!.postId);

        if (r instanceof ErrorResult) {
            respond(res, 404, r.error);
            return;
        }
        respond(res, 204, `Comment '${req.category!.categoryId}' deleted`);
    });

    return comments;
}

export default PostCategoriesRouter;