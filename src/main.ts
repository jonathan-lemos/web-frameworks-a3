import express from "express";
import fs from "fs";
import DbContext from "./data/database";
import statuses from "statuses";
import cookieParser from "cookie-parser";
import UsersRouter from "./routers/users";
import PostsRouter from "./routers/posts";
import CommentsRouter, { PostCategoriesRouter } from "./routers/post-categories";
import CategoriesRouter from "./routers/categories";

const db = new DbContext("database.db");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("page"));
app.use(cookieParser());
app.use("/Users", UsersRouter(db));
app.use("/Posts", PostsRouter(db));
app.use("/Comments", CommentsRouter(db));
app.use("/Categories", CategoriesRouter(db));
app.use("/PostCategories", PostCategoriesRouter(db));

console.log("Express listening on port 3000");
app.listen(3000);
