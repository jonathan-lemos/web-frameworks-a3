import express from "express";
import DbContext from "./data/database";
import cookieParser from "cookie-parser";
import UsersRouter from "./routers/users";
import PostsRouter from "./routers/posts";
import PostCategoriesRouter from "./routers/post-categories";
import CommentsRouter from "./routers/comments";
import CategoriesRouter from "./routers/categories";
import respond from "./api/respond";
import cors from "cors";
import env from "./env";

const db = new DbContext("database.db");
const app = express();

app.use(cors({
    origin: env.origin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("page"));
app.use(cookieParser());
app.use("/Users", UsersRouter(db));
app.use("/Posts", PostsRouter(db));
app.use("/Comments", CommentsRouter(db));
app.use("/Categories", CategoriesRouter(db));
app.use("/PostCategories", PostCategoriesRouter(db));

app.use("*", (req, res) => respond(res, 404, `Invalid endpoint ${req.method} '${req.originalUrl}'`));

console.log("Express listening on port 3000");
app.listen(3000);
