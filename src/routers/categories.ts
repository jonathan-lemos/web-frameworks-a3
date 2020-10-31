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

    categories.use(authorize(db));

    categories.post("/", (req, res) => {
        const b = req.body;

        if (
        typeof b.name !== "string" ||
        typeof b.description !== "string") {
            respond(res, 400, "The request body needs 'name' and 'description' keys.");
            return;
        }

        try {
            const r = db.addCategory(b);
            respond(res, 201, `Category created.`);
        }
        catch (e) {
            respond(res, 409, `A category called ${b.name} already exists.`);
        }
    });

    categories.patch("/:categoryId", (req: CategoryAssignableRequest, res) => {
        const r = db.updateCategory({ ...req.body, categoryId: req.category!.categoryId });
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