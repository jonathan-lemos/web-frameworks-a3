import sqlite, { Database } from "better-sqlite3";
import User, { AddUser, DbUser, dbUserToUser } from "./user";
import jwt from "jsonwebtoken";
import Post, { dbPostToPost, postToDbPost } from "./post";
import argon2 from "argon2";
import Category from "./category";
import PostCategory from "./post-category";
import Comment, { commentToDbComment, dbCommentToComment } from "./comment";

const SUPER_SECRET_STRING = "hunter2";

export interface AuthPayload {
    id: string
};

const isAuthPayload = (a: any): a is AuthPayload => {
    return typeof a.id === "string";
}

export default class DbContext {
    private db: Database;

    public constructor(dbFilename: string) {
        this.db = sqlite(dbFilename);

        this.db.prepare(`
        CREATE TABLE IF NOT EXISTS Categories (
            categoryId INT PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Users (
            userId INT PRIMARY KEY AUTOINCREMENT,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            emailAddress VARCHAR(255) NOT NULL,
            passwordHash VARCHAR(1023) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Posts (
            postId INT PRIMARY KEY AUTOINCREMENT,
            userId INT FOREIGN KEY REFERENCES Users(userId) NOT NULL ON DELETE CASCADE,
            createdDate INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            headerImage VARCHAR(255) NOT NULL,
            lastUpdated INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Comments (
            commentId INT NOT NULL,
            userId VARCHAR(255) FOREIGN KEY REFERENCES Users(userId) NOT NULL ON DELETE CASCADE,
            postId INT FOREIGN KEY REFERENCES Posts(postId) NOT NULL ON DELETE CASCADE,
            comment TEXT NOT NULL,
            commentDate INTEGER NOT NULL,
            PRIMARY KEY (commentId, userId)
        );

        CREATE TABLE IF NOT EXISTS PostCategories (
            categoryId INT FOREIGN KEY REFERENCES Categories(categoryId) NOT NULL ON DELETE CASCADE,
            postId INT FOREIGN KEY REFERENCES Posts(postId) NOT NULL ON DELETE CASCADE,
            UNIQUE(categoryId, postId)
        );
        `).run();
    }

    public users(): User[] {
        return this.db.prepare("SELECT * FROM USERS;")
            .all()
            .map(dbUserToUser);
    }

    public user(userId: string): User | null {
        const x = this.db.prepare("SELECT * FROM USERS WHERE userId = ?;")
            .all(userId)
            .map(dbUserToUser);

        return x.length > 0 ? x[0] : null;
    }

    public async addUser(u: AddUser): Promise<boolean> {
        const hash = await argon2.hash(u.password);
        const dbu: DbUser = {...u, passwordHash: hash};

        const res = this.db.prepare("INSERT INTO Users VALUES(@userId, @firstName, @lastName, @emailAddress, @password)")
            .run(dbu);

        return res.changes > 0;
    }

    public async updateUser(u: Partial<AddUser> & { userId: string }): Promise<boolean> {
        const id = u.userId;

        if (this.user(id) == null) {
            return false;
        }

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

    public deleteUser(userId: string): boolean {
        const res = this.db.prepare("DELETE FROM Users WHERE userId = ?").run(userId);

        return res.changes > 0;
    }

    public userPosts(userId: string): Post[] {
        return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(dbPostToPost);
    }

    public async authenticateUser(id: string, password: string): Promise<string | null> {
        const res = this.db.prepare("SELECT * FROM Users WHERE userId = ?")
            .all(id, password);

        if (res.length === 0) {
            return null;
        }

        if (!argon2.verify(res[0].passwordHash, password)) {
            return null;
        }

        const payload: AuthPayload = {id};

        const token = jwt.sign(payload, SUPER_SECRET_STRING);
        return token;
    }

    public decodeToken(token: string): AuthPayload | null {
        if (!jwt.verify(token, SUPER_SECRET_STRING)) {
            return null;
        }

        const res = jwt.decode(token);

        if (!isAuthPayload(res)) {
            return null;
        }
        return res;
    }

    public posts(userId?: string): Post[] | null {
        if (userId) {
            if (this.user(userId) === null) {
                return null;
            }

            return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(dbPostToPost);
        }

        return this.db.prepare("SELECT * FROM Posts ORDER BY createdDate DESC").all().map(dbPostToPost);
    }

    public post(postId: number): Post | null {
        const res = this.db.prepare("SELECT * FROM Posts WHERE postId = ?").all(postId).map(dbPostToPost);
        return res.length > 0 ? res[0] : null;
    }

    public addPost(post: Post): void {
        const p = postToDbPost(post);

        this.db.prepare("INSERT INTO Posts VALUES (@userId, @createdDate, @title, @content, @headerImage, @lastUpdated)")
        .run(p);
    }

    public updatePost(p: Partial<{content: string, headerImage: string}> & {postId: number}): boolean {
        if (this.post(p.postId) == null) {
            return false;
        }

        if (typeof p.content === "string") {
            this.db.prepare("UPDATE Posts SET content = ? WHERE postId = ?").run(p.content, p.postId);
        }

        if (typeof p.headerImage === "string") {
            this.db.prepare("UPDATE Posts SET headerImage = ? WHERE postId = ?").run(p.headerImage, p.postId);
        }
        
        return true;
    }

    public deletePost(postId: number): boolean {
        const res = this.db.prepare("DELETE FROM Posts WHERE postId = ?").run(postId);

        return res.changes > 0;
    }

    public categories(): Category[] {
        return this.db.prepare("SELECT * FROM Categories").all();
    }

    public category(categoryId: number): Post | null {
        const res = this.db.prepare("SELECT * FROM Categories WHERE categoryId = ?").all(categoryId);
        return res.length > 0 ? res[0] : null;
    }

    public addCategory(category: Category): void {
        this.db.prepare("INSERT INTO Categories VALUES (@name, @description)")
        .run(category);
    }

    public updateCategory(c: Partial<Category> & {categoryId: number}): boolean {
        if (this.category(c.categoryId) == null) {
            return false;
        }

        if (typeof c.name === "string") {
            this.db.prepare("UPDATE Categories SET name = ? WHERE categoryId = ?").run(c.name, c.categoryId);
        }

        if (typeof c.description === "string") {
            this.db.prepare("UPDATE Categories SET description = ? WHERE categoryId = ?").run(c.description, c.categoryId);
        }
        
        return true;
    }

    public deleteCategory(categoryId: number): boolean {
        const res = this.db.prepare("DELETE FROM Categories WHERE categoryId = ?").run(categoryId);

        return res.changes > 0;
    }

    public postCategories(postId: number): Category[] {
        return this.db.prepare(`
        SELECT c.* from Posts p 
        INNER JOIN PostCategories pc on p.postId = pc.postId
        INNER JOIN Categories c on pc.categoryId = c.categoryId
        WHERE p.postId = ?`).all(postId);
    }

    public categoryPosts(categoryId: number): Post[] {
        return this.db.prepare(`
        SELECT p.* from Categories c 
        INNER JOIN PostCategories pc on c.categoryId = pc.categoryId
        INNER JOIN Posts p on pc.postId = p.postId
        WHERE c.categoryId = ?`).all(categoryId);
    }

    public addPostCategory(pc: PostCategory): boolean {
        const res = this.db.prepare("INSERT INTO PostCategories VALUES(@categoryId, @postId)").run(pc);

        return res.changes > 0;
    }

    public deletePostCategory(categoryId: number, postId: number): boolean {
        const res = this.db.prepare("DELETE FROM PostCategories WHERE categoryId = ? AND postId = ?").run(categoryId, postId);

        return res.changes > 0;
    }

    public comments(postId: number): Comment[] {
        return this.db.prepare("SELECT * FROM Comments WHERE postId = ?").all(postId).map(dbCommentToComment);
    }

    public comment(postId: number, commentId: number): Comment | null {
        const res = this.db.prepare("SELECT * FROM Comments WHERE commentId = ? AND postId = ?").all(commentId, postId);
        return res.length > 0 ? res[0] : null;
    }

    public addComment(c: Comment): boolean {
        const comments = this.db.prepare("SELECT * FROM Comments WHERE userId = ? ORDER BY commentId DESC").all(c.userId);
        let id = 1;
        if (comments.length > 0) {
            id = comments[0].commentId + 1;
        }

        const dc = {...commentToDbComment(c), commentId: id};

        const res = this.db.prepare("INSERT INTO Comments VALUES (@commentId, @userId, @postId, @comment, @commentDate)").run(dc);
        return res.changes > 0;
    }

    public updateComment(postId: number, commentId: number, content: string): boolean {
        const res = this.db.prepare("UPDATE Comments SET comment = ? WHERE commentId = ? AND postId = ?").run(content, commentId, postId);

        return res.changes > 0;
    }

    public deleteComment(postId: number, commentId: number): boolean {
        const res = this.db.prepare("DELETE FROM Comments WHERE commentId = ? AND postId = ?").run(commentId, postId);

        return res.changes > 0;
    }
}