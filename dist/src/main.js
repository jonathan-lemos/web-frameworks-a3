"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("./data/database"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const users_1 = __importDefault(require("./routers/users"));
const posts_1 = __importDefault(require("./routers/posts"));
const post_categories_1 = __importStar(require("./routers/post-categories"));
const categories_1 = __importDefault(require("./routers/categories"));
const respond_1 = __importDefault(require("./api/respond"));
const db = new database_1.default("database.db");
const app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static("page"));
app.use(cookie_parser_1.default());
app.use("/Users", users_1.default(db));
app.use("/Posts", posts_1.default(db));
app.use("/Comments", post_categories_1.default(db));
app.use("/Categories", categories_1.default(db));
app.use("/PostCategories", post_categories_1.PostCategoriesRouter(db));
app.use("*", (req, res) => respond_1.default(res, 404, `Invalid URL '${req.url}'`));
console.log("Express listening on port 3000");
app.listen(3000);
//# sourceMappingURL=main.js.map