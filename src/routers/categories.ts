import express from "express";
import DbContext from "../data/database";
import respond from "../api/respond";
import authorize from "../api/authorize";
import Category from "../data/category";

export const CategoriesRouter = (db: DbContext) => {
    const categories = express.Router();

    type CategoryAssignableRequest = express.Request & Partial<{category: Category}>;

    categories.param("categoryId", (req: CategoryAssignableRequest, res, next, id) => {
        const category = db.category(id);

        if (category === null) {
            respond(res, 404, `No category with categoryId '${id}'`);
            return;
        }

        req.category = category;

        next();
    });

    categories.get("/", (req, res) => {
        res.json(db.categories());
    });

    categories.get("/:categoryId", (req: CategoryAssignableRequest, res) => {
        res.json(req.category);
    });

    categories.post("/", (req, res) => {
        const b = req.body;

        if (
        typeof b.userId !== "string" ||
        typeof b.title !== "string" ||
        typeof b.content !== "string" ||
        typeof b.headerImage !== "string") {
            respond(res, 400, "The request body needs 'categoryId', 'userId', 'title', 'content', and 'headerImage' keys.");
            return;
        }

        const r = db.addCategory(b);
        respond(res, 201, `Category created.`);
    });

    categories.use(authorize(db));

    categories.patch("/:categoryId", (req: CategoryAssignableRequest, res) => {
        const r = db.updateCategory({...req.body, categoryId: req.category!.categoryId});
        if (!r) {
            respond(res, 404, `Category '${req.category!.categoryId}' does not exist.`);
            return;
        }
        respond(res, 200, `Category '${req.category!.categoryId}' updated`);
    });

    categories.delete("/:categoryId", (req: CategoryAssignableRequest, res) => {
        const r = db.deleteCategory(req.category!.categoryId);
        if (!r) {
            respond(res, 404, `Category '${req.category!.categoryId}' does not exist.`);
            return;
        }
        respond(res, 204, `Category '${req.category!.categoryId}' deleted`);
    });

    return categories;
}

export default CategoriesRouter;