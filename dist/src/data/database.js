"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const user_1 = require("./user");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const post_1 = require("./post");
const argon2_1 = __importDefault(require("argon2"));
const comment_1 = require("./comment");
const crypto_1 = __importDefault(require("crypto"));
const date_1 = require("./date");
const SUPER_SECRET_STRING = "hunter2";
;
const isAuthPayload = (a) => {
    return typeof a.id === "string";
};
class DbContext {
    constructor(dbFilename) {
        this.db = better_sqlite3_1.default(dbFilename);
        const stmts = [
            `
        CREATE TABLE IF NOT EXISTS Categories (
            categoryId INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL
        );
`, `
        CREATE TABLE IF NOT EXISTS Users (
            userId VARCHAR(255) PRIMARY KEY,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            emailAddress VARCHAR(255) NOT NULL,
            passwordHash VARCHAR(1023) NOT NULL
        );
`, `
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
`, `
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
`, `
        CREATE TABLE IF NOT EXISTS PostCategories (
            categoryId INTEGER NOT NULL,
            postId INTEGER NOT NULL,
            UNIQUE(categoryId, postId),
            FOREIGN KEY (categoryId) REFERENCES Categories(categoryId) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (postId) REFERENCES Posts(postId) ON DELETE CASCADE ON UPDATE CASCADE
        );
        `
        ];
        stmts.forEach(stmt => this.db.prepare(stmt).run());
    }
    users() {
        return this.db.prepare("SELECT * FROM USERS;")
            .all()
            .map(user_1.dbUserToUser);
    }
    user(userId) {
        const x = this.db.prepare("SELECT * FROM USERS WHERE userId = ?;")
            .all(userId)
            .map(user_1.dbUserToUser);
        return x.length > 0 ? x[0] : null;
    }
    async addUser(u) {
        const hash = await argon2_1.default.hash(u.password);
        const dbu = { ...u, passwordHash: hash };
        try {
            const res = this.db.prepare("INSERT INTO Users VALUES(@userId, @firstName, @lastName, @emailAddress, @passwordHash)")
                .run(dbu);
            return res.changes > 0;
        }
        catch (e) {
            return false;
        }
    }
    async updateUser(u) {
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
            const hash = await argon2_1.default.hash(u.password);
            this.db.prepare("UPDATE Users SET passwordHash = ? WHERE userId = ?").run(hash, id);
        }
        return true;
    }
    deleteUser(userId) {
        const res = this.db.prepare("DELETE FROM Users WHERE userId = ?").run(userId);
        return res.changes > 0;
    }
    userPosts(userId) {
        return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(post_1.dbPostToPost);
    }
    async authenticateUser(id, password) {
        const res = this.db.prepare("SELECT * FROM Users WHERE userId = ?")
            .all(id);
        if (res.length === 0) {
            return null;
        }
        try {
            if (!(await argon2_1.default.verify(res[0].passwordHash, password))) {
                return null;
            }
        }
        catch (e) {
            return null;
        }
        const payload = { id, seed: crypto_1.default.randomInt(281474976710655) };
        const token = jsonwebtoken_1.default.sign(payload, SUPER_SECRET_STRING);
        return token;
    }
    decodeToken(token) {
        if (!jsonwebtoken_1.default.verify(token, SUPER_SECRET_STRING)) {
            return null;
        }
        const res = jsonwebtoken_1.default.decode(token);
        if (!isAuthPayload(res)) {
            return null;
        }
        return res;
    }
    posts(userId) {
        if (userId) {
            if (this.user(userId) === null) {
                return null;
            }
            return this.db.prepare("SELECT * FROM Posts WHERE userId = ?").all(userId).map(post_1.dbPostToPost);
        }
        return this.db.prepare("SELECT * FROM Posts ORDER BY createdDate DESC").all().map(post_1.dbPostToPost);
    }
    post(postId) {
        const res = this.db.prepare("SELECT * FROM Posts WHERE postId = ?").all(postId).map(post_1.dbPostToPost);
        return res.length > 0 ? res[0] : null;
    }
    addPost(post) {
        const p = post_1.postToDbPost(post);
        try {
            const res = this.db.prepare("INSERT INTO Posts(userId, createdDate, title, content, headerImage, lastUpdated) VALUES (@userId, @createdDate, @title, @content, @headerImage, @lastUpdated)")
                .run(p);
            return res.changes > 0;
        }
        catch (e) {
            return false;
        }
    }
    updatePost(p) {
        if (this.post(p.postId) == null) {
            return false;
        }
        if (typeof p.content === "string") {
            this.db.prepare("UPDATE Posts SET content = ? WHERE postId = ?").run(p.content, p.postId);
            this.db.prepare("UPDATE Posts SET lastUpdated = ? WHERE postId = ?").run(date_1.dateToNumber(new Date()), p.postId);
        }
        if (typeof p.headerImage === "string") {
            this.db.prepare("UPDATE Posts SET headerImage = ? WHERE postId = ?").run(p.headerImage, p.postId);
            this.db.prepare("UPDATE Posts SET lastUpdated = ? WHERE postId = ?").run(date_1.dateToNumber(new Date()), p.postId);
        }
        return true;
    }
    deletePost(postId) {
        const res = this.db.prepare("DELETE FROM Posts WHERE postId = ?").run(postId);
        return res.changes > 0;
    }
    categories() {
        return this.db.prepare("SELECT * FROM Categories").all();
    }
    category(categoryId) {
        const res = this.db.prepare("SELECT * FROM Categories WHERE categoryId = ?").all(categoryId);
        return res.length > 0 ? res[0] : null;
    }
    addCategory(category) {
        this.db.prepare("INSERT INTO Categories(name, description) VALUES (@name, @description)")
            .run(category);
    }
    updateCategory(c) {
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
    deleteCategory(categoryId) {
        const res = this.db.prepare("DELETE FROM Categories WHERE categoryId = ?").run(categoryId);
        return res.changes > 0;
    }
    postCategories(postId) {
        return this.db.prepare(`
        SELECT c.* from Posts p 
        INNER JOIN PostCategories pc on p.postId = pc.postId
        INNER JOIN Categories c on pc.categoryId = c.categoryId
        WHERE p.postId = ?`).all(postId);
    }
    categoryPosts(categoryId) {
        return this.db.prepare(`
        SELECT p.* from Categories c 
        INNER JOIN PostCategories pc on c.categoryId = pc.categoryId
        INNER JOIN Posts p on pc.postId = p.postId
        WHERE c.categoryId = ?`).all(categoryId);
    }
    addPostCategory(pc) {
        const res = this.db.prepare("INSERT INTO PostCategories VALUES(@categoryId, @postId)").run(pc);
        return res.changes > 0;
    }
    deletePostCategory(categoryId, postId) {
        const res = this.db.prepare("DELETE FROM PostCategories WHERE categoryId = ? AND postId = ?").run(categoryId, postId);
        return res.changes > 0;
    }
    comments(postId) {
        return this.db.prepare("SELECT * FROM Comments WHERE postId = ?").all(postId).map(comment_1.dbCommentToComment);
    }
    comment(postId, commentId) {
        const res = this.db.prepare("SELECT * FROM Comments WHERE commentId = ? AND postId = ?").all(commentId, postId);
        return res.length > 0 ? res[0] : null;
    }
    addComment(c) {
        const comments = this.db.prepare("SELECT * FROM Comments WHERE userId = ? ORDER BY commentId DESC").all(c.userId);
        let id = 1;
        if (comments.length > 0) {
            id = comments[0].commentId + 1;
        }
        const dc = { ...comment_1.commentToDbComment(c), commentId: id };
        const res = this.db.prepare("INSERT INTO Comments VALUES (@commentId, @userId, @postId, @comment, @commentDate)").run(dc);
        return res.changes > 0;
    }
    updateComment(userId, postId, commentId, content) {
        const res = this.db.prepare("UPDATE Comments SET comment = ? WHERE userId = ? AND commentId = ? AND postId = ?").run(content, userId, commentId, postId);
        return res.changes > 0;
    }
    deleteComment(postId, commentId) {
        const res = this.db.prepare("DELETE FROM Comments WHERE commentId = ? AND postId = ?").run(commentId, postId);
        return res.changes > 0;
    }
}
exports.default = DbContext;
//# sourceMappingURL=database.js.map