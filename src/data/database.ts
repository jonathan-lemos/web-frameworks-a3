import sqlite, { Database, SqliteError } from "better-sqlite3";
import User, { AddUser, DbUser, dbUserToUser } from "./user";
import jwt from "jsonwebtoken";
import Post, { dbPostToPost, postToDbPost } from "./post";
import argon2 from "argon2";
import Category from "./category";
import PostCategory from "./post-category";
import Comment, { commentToDbComment, dbCommentToComment } from "./comment";
import crypto from "crypto";
import { dateToNumber } from "./date";
import ErrorResult from "../api/errorResult";

const SUPER_SECRET_STRING = "hunter2";

export interface AuthPayload {
    id: string,
    seed: number
};

const isAuthPayload = (a: any): a is AuthPayload => {
    return typeof a.id === "string";
}

export default class DbContext {
    private db: Database;

    public constructor(dbFilename: string) {
        this.db = sqlite(dbFilename);

        const stmts = [
`
        CREATE TABLE IF NOT EXISTS Categories (
            categoryId INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL
        );
`,`
        CREATE TABLE IF NOT EXISTS Users (
            userId VARCHAR(255) PRIMARY KEY,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            emailAddress VARCHAR(255) NOT NULL,
            passwordHash VARCHAR(1023) NOT NULL
        );
`,`
        CREATE TABLE IF NOT EXISTS Posts (
            postId INTEGER PRIMARY KEY AUTOINCREMENT,
            userId VARCHAR(255) NOT NULL,
            createdDate INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            headerImage VARCHAR(255) NOT NULL,
            lastUpdated INTEGER NOT NULL,
            FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE ON UPDATE CASCADE
        );
`,`
        CREATE TABLE IF NOT EXISTS Comments (
            commentId INTEGER NOT NULL,
            userId VARCHAR(255) NOT NULL,
            postId INTEGER NOT NULL,
            comment TEXT NOT NULL,
            commentDate INTEGER NOT NULL,
            PRIMARY KEY (commentId, userId),
            FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (postId) REFERENCES Posts(postId) ON DELETE CASCADE ON UPDATE CASCADE
        );
`,`
        CREATE TABLE IF NOT EXISTS PostCategories (
            categoryId INTEGER NOT NULL,
            postId INTEGER NOT NULL,
            UNIQUE(categoryId, postId),
            FOREIGN KEY (categoryId) REFERENCES Categories(categoryId) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (postId) REFERENCES Posts(postId) ON DELETE CASCADE ON UPDATE CASCADE
        );
        `
        ]

        stmts.forEach(stmt => this.db.prepare(stmt).run());
    }

    public users(): User[] | ErrorResult<string> {
        try {
            return this.db.prepare("SELECT * FROM USERS;")
                .all()
                .map(dbUserToUser);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public user(userId: string): User | ErrorResult<string> {
        try {
            const x = this.db.prepare("SELECT * FROM USERS WHERE userId = ?;")
                .all(userId)
                .map(dbUserToUser);

            return x.length > 0 ? x[0] : new ErrorResult(`No users with id '${userId}'.`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public async addUser(u: AddUser): Promise<true | ErrorResult<string>> {
        const hash = await argon2.hash(u.password);
        const dbu: DbUser = { ...u, passwordHash: hash };

        try {
            const res = this.db.prepare("INSERT INTO Users VALUES(@userId, @firstName, @lastName, @emailAddress, @passwordHash)")
                .run(dbu);

            return res.changes > 0 ? true : new ErrorResult(`A user with id '${u.userId}' already exists.`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public async updateUser(u: Partial<AddUser> & { userId: string }): Promise<true | ErrorResult<string>> {
        const id = u.userId;
        const q = this.user(id);

        if (q instanceof ErrorResult) {
            return q;
        }

        try {
            if (typeof u.firstName === "string") {
                this.db.prepare("UPDATE Users SET firstName = ? WHERE userId = ?").run(u.firstName, id);
            }

            if (typeof u.lastName === "string") {
                this.db.prepare("UPDATE Users SET lastName = ? WHERE userId = ?").run(u.lastName, id);
            }

            if (typeof u.emailAddress === "string") {
                this.db.prepare("UPDATE Users SET emailAddress = ? WHERE userId = ?").run(u.emailAddress, id);
            }

            if (typeof u.password === "string") {
                const hash = await argon2.hash(u.password);
                this.db.prepare("UPDATE Users SET passwordHash = ? WHERE userId = ?").run(hash, id);
            }

            return true;
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public deleteUser(userId: string): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("DELETE FROM Users WHERE userId = ?").run(userId);

            return res.changes > 0 ? true : new ErrorResult(`No user with id '${userId}'.`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public userPosts(userId: string): Post[] {
        return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(dbPostToPost);
    }

    public async authenticateUser(id: string, password: string): Promise<string | ErrorResult<string>> {
        const res = this.db.prepare("SELECT * FROM Users WHERE userId = ?")
            .all(id);

        if (res.length === 0) {
            return new ErrorResult(`No user named '${id}'.`);
        }

        try {
            if (!(await argon2.verify(res[0].passwordHash, password))) {
                return new ErrorResult(`Invalid password given for user '${id}'.`);
            }
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }

        const payload: AuthPayload = { id, seed: crypto.randomInt(281474976710655) };

        const token = jwt.sign(payload, SUPER_SECRET_STRING, { expiresIn: "24h", subject: id });
        return token;
    }

    public decodeToken(token: string): AuthPayload | ErrorResult<string> {
        try {
            if (!jwt.verify(token, SUPER_SECRET_STRING)) {
                return new ErrorResult("The JWT could not be verified.");
            }

            const res = jwt.decode(token);

            if (!isAuthPayload(res)) {
                return new ErrorResult("The JWT payload is of an invalid format.");
            }
            return res;
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public posts(userId?: string): Post[] | ErrorResult<string> {
        try {
            if (userId) {
                if (this.user(userId) === null) {
                    return new ErrorResult("Invalid user ID");
                }

                return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(dbPostToPost);
            }

            return this.db.prepare("SELECT * FROM Posts ORDER BY createdDate DESC").all().map(dbPostToPost);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public post(postId: number): Post | ErrorResult<string> {
        try {
            const res = this.db.prepare("SELECT * FROM Posts WHERE postId = ?").all(postId).map(dbPostToPost);
            return res.length > 0 ? res[0] : new ErrorResult(`No post with the given postId '${postId}'`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public addPost(post: Post): true | ErrorResult<string> {
        const p = postToDbPost(post);

        try {
            const res = this.db.prepare("INSERT INTO Posts(userId, createdDate, title, content, headerImage, lastUpdated) VALUES (@userId, @createdDate, @title, @content, @headerImage, @lastUpdated)")
                .run(p);
            return res.changes > 0 ? true : new ErrorResult("Duplicate post");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public updatePost(p: Partial<{ content: string, headerImage: string }> & { postId: number }): true | ErrorResult<string> {
        try {
            if (this.post(p.postId) == null) {
                return new ErrorResult(`No such post with postId '${p.postId}'`);
            }
    
            if (typeof p.content === "string") {
                this.db.prepare("UPDATE Posts SET content = ? WHERE postId = ?").run(p.content, p.postId);
                this.db.prepare("UPDATE Posts SET lastUpdated = ? WHERE postId = ?").run(dateToNumber(new Date()), p.postId);
            }
    
            if (typeof p.headerImage === "string") {
                this.db.prepare("UPDATE Posts SET headerImage = ? WHERE postId = ?").run(p.headerImage, p.postId);
                this.db.prepare("UPDATE Posts SET lastUpdated = ? WHERE postId = ?").run(dateToNumber(new Date()), p.postId);
            }
    
            return true;
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public deletePost(postId: number): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("DELETE FROM Posts WHERE postId = ?").run(postId);

            return res.changes > 0 ? true : new ErrorResult<string>(`No such postId '${postId}'`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public categories(): Category[] | ErrorResult<string> {
        try {
            return this.db.prepare("SELECT * FROM Categories").all();
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public category(categoryId: number): Category | ErrorResult<string> {
        try {
            const res = this.db.prepare("SELECT * FROM Categories WHERE categoryId = ?").all(categoryId);
            return res.length > 0 ? res[0] : new ErrorResult(`No such category with id '${categoryId}'`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public addCategory(category: Category): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("INSERT INTO Categories(name, description) VALUES (@name, @description)")
                .run(category);
            return res.changes > 0 ? true : new ErrorResult("Duplicate category");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public updateCategory(c: Partial<Category> & { categoryId: number }): true | ErrorResult<string> {
        try {
            if (this.category(c.categoryId) == null) {
                return new ErrorResult(`No such category with id '${c.categoryId}'`);
            }
    
            if (typeof c.name === "string") {
                this.db.prepare("UPDATE Categories SET name = ? WHERE categoryId = ?").run(c.name, c.categoryId);
            }
    
            if (typeof c.description === "string") {
                this.db.prepare("UPDATE Categories SET description = ? WHERE categoryId = ?").run(c.description, c.categoryId);
            }
    
            return true;
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public deleteCategory(categoryId: number): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("DELETE FROM Categories WHERE categoryId = ?").run(categoryId);

            return res.changes > 0 ? true : new ErrorResult(`No category with id '${categoryId}'`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public postCategories(postId: number): Category[] | ErrorResult<string> {
        try {
            return this.db.prepare(`
            SELECT c.* from Posts p 
            INNER JOIN PostCategories pc on p.postId = pc.postId
            INNER JOIN Categories c on pc.categoryId = c.categoryId
            WHERE p.postId = ?`).all(postId);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public categoryPosts(categoryId: number): Post[] | ErrorResult<string> {
        try {
            return this.db.prepare(`
            SELECT p.* from Categories c 
            INNER JOIN PostCategories pc on c.categoryId = pc.categoryId
            INNER JOIN Posts p on pc.postId = p.postId
            WHERE c.categoryId = ?`).all(categoryId);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public addPostCategory(pc: PostCategory): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("INSERT INTO PostCategories VALUES(@categoryId, @postId)").run(pc);

            return res.changes > 0 ? true : new ErrorResult("Duplicate PostCategory");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public deletePostCategory(categoryId: number, postId: number): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("DELETE FROM PostCategories WHERE categoryId = ? AND postId = ?").run(categoryId, postId);

            return res.changes > 0 ? true : new ErrorResult("A PostCategory with the given parameters was not found.");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public comments(postId: number): Comment[] | ErrorResult<string> {
        try {
            return this.db.prepare("SELECT * FROM Comments WHERE postId = ?").all(postId).map(dbCommentToComment);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public comment(postId: number, commentId: number): Comment | ErrorResult<string> {
        try {
            const res = this.db.prepare("SELECT * FROM Comments WHERE commentId = ? AND postId = ?").all(commentId, postId);
            return res.length > 0 ? res[0] : new ErrorResult(`No comments with the given postId and commentId`);
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public addComment(c: Comment): true | ErrorResult<string> {
        try {
            const comments = this.db.prepare("SELECT * FROM Comments WHERE userId = ? ORDER BY commentId DESC").all(c.userId);
            let id = 1;
            if (comments.length > 0) {
                id = comments[0].commentId + 1;
            }
    
            const dc = { ...commentToDbComment(c), commentId: id };
    
            const res = this.db.prepare("INSERT INTO Comments VALUES (@commentId, @userId, @postId, @comment, @commentDate)").run(dc);
            return res.changes > 0 ? true : new ErrorResult("Duplicate comment");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public updateComment(userId: string, postId: number, commentId: number, content: string): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("UPDATE Comments SET comment = ? WHERE userId = ? AND commentId = ? AND postId = ?").run(content, userId, commentId, postId);

            return res.changes > 0 ? true : new ErrorResult("Could not find a comment with the given input parameters");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }

    public deleteComment(postId: number, commentId: number): true | ErrorResult<string> {
        try {
            const res = this.db.prepare("DELETE FROM Comments WHERE commentId = ? AND postId = ?").run(commentId, postId);

            return res.changes > 0 ? true : new ErrorResult("Could not find a comment with the given input parameters");
        }
        catch (e) {
            return new ErrorResult(e.message ?? e);
        }
    }
}