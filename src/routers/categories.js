"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesRouter = void 0;
const express_1 = __importDefault(require("express"));
const respond_1 = __importDefault(require("../api/respond"));
const authorize_1 = __importDefault(require("../api/authorize"));
exports.CategoriesRouter = (db) => {
    const categories = express_1.default.Router();
    categories.param("categoryId", (req, res, next, id) => {
        const category = db.category(id);
        if (category === null) {
            respond_1.default(res, 404, `No category with categoryId '${id}'`);
            return;
        }
        req.category = category;
        next();
    });
    categories.get("/", (req, res) => {
        res.json(db.categories());
    });
    categories.get("/:categoryId", (req, res) => {
        res.json(req.category);
    });
    categories.post("/", (req, res) => {
        const b = req.body;
        if (typeof b.userId !== "string" ||
            typeof b.title !== "string" ||
            typeof b.content !== "string" ||
            typeof b.headerImage !== "string") {
            respond_1.default(res, 400, "The request body needs 'categoryId', 'userId', 'title', 'content', and 'headerImage' keys.");
            return;
        }
        const r = db.addCategory(b);
        respond_1.default(res, 201, `Category created.`);
    });
    categories.use(authorize_1.default(db));
    categories.patch("/:categoryId", (req, res) => {
        const r = db.updateCategory({ ...req.body, categoryId: req.category.categoryId });
        if (!r) {
            respond_1.default(res, 404, `Category '${req.category.categoryId}' does not exist.`);
            return;
        }
        respond_1.default(res, 200, `Category '${req.category.categoryId}' updated`);
    });
    categories.delete("/:categoryId", (req, res) => {
        const r = db.deleteCategory(req.category.categoryId);
        if (!r) {
            respond_1.default(res, 404, `Category '${req.category.categoryId}' does not exist.`);
            return;
        }
        respond_1.default(res, 204, `Category '${req.category.categoryId}' deleted`);
    });
    return categories;
};
exports.default = exports.CategoriesRouter;
