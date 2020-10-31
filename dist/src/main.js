"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("./data/database"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const users_1 = __importDefault(require("./routers/users"));
const posts_1 = __importDefault(require("./routers/posts"));
const post_categories_1 = __importDefault(require("./routers/post-categories"));
const comments_1 = __importDefault(require("./routers/comments"));
const categories_1 = __importDefault(require("./routers/categories"));
const respond_1 = __importDefault(require("./api/respond"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("./env"));
const db = new database_1.default("database.db");
const app = express_1.default();
app.use(cors_1.default({
    origin: env_1.default.origin,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static("page"));
app.use(cookie_parser_1.default());
app.use("/Users", users_1.default(db));
app.use("/Posts", posts_1.default(db));
app.use("/Comments", comments_1.default(db));
app.use("/Categories", categories_1.default(db));
app.use("/PostCategories", post_categories_1.default(db));
app.use("*", (req, res) => respond_1.default(res, 404, `Invalid endpoint ${req.method} '${req.originalUrl}'`));
console.log("Express listening on port 3000");
app.listen(3000);
//# sourceMappingURL=main.js.map