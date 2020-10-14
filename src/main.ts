import express from "express";
import fs from "fs";
import DbContext from "./data/database";
import statuses from "statuses";


const s = (s: any): string => {
    if (typeof s === "string" && s.trim()) {
        return s.trim();
    }
    return "";
}

const db = new DbContext("database.db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("page"));

app.get("/", (req, res) => {
    const text = fs.readFileSync("page/index.html");
    res.set("Content-Type", "text/html");
    res.send(text);
});

app.get("/Users", (req, res) => {
    res.json(db.users());
});

app.post("/User", (req, res) => {
    const b = req.body;

    if (!((b.UserID = s(b.UserID)) &&
    (b.FirstName = s(b.FirstName)) &&
    (b.LastName = s(b.LastName)) &&
    (b.EmailAddress = s(b.EmailAddress)) &&
    (b.Password = s(b.Password)))) {
        res.status(400);
        res.json(error("The post body must have 'UserID', 'FirstName' and 'LastName' entries."));
        return;
    }

    const users = readUsers();
    if (users.some(x => x.UserID == b.UserID)) {
        res.status(400);
        res.json(error(`A user with UserID ${b.UserID} already exists.`));
        return;
    }

    users.push({UserID: b.UserID, FirstName: b.FirstName, LastName: b.LastName, EmailAddress: b.EmailAddress, Password: b.Password});
    writeUsers(users);

    res.status(201);
    res.json(ok(`The user ${b.UserID} was successfully created.`))
});

app.get("/User/:id", (req, res) => {
    if (typeof req.params.id !== "string") {
        res.status(404);
        res.json(error("An id must be given."))
        return;
    }

    const users = readUsers().filter(x => x.UserID === req.params.id);
    if (users.length === 0) {
        res.status(404);
        res.json(error(`No user found with id '${req.params.id}'`))
        return;
    }

    res.json(users[0]);
});

app.patch("/User/:id", (req, res) => {
    if (typeof req.params.id !== "string") {
        res.status(404);
        res.json(error("An id must be given."))
        return;
    }

    const oldUsers = readUsers();
    const users = oldUsers.filter(x => x.UserID === req.params.id);
    if (users.length === 0) {
        res.status(404);
        res.json(error(`No user found with id '${req.params.id}'`))
        return;
    }

    const user = users[0];

    if (s(req.body.FirstName)) {
        user.FirstName = s(req.body.FirstName);
    }

    if (s(req.body.LastName)) {
        user.LastName = s(req.body.LastName);
    }

    if (s(req.body.EmailAddress)) {
        user.EmailAddress = s(req.body.EmailAddress);
    }

    if (s(req.body.Password)) {
        user.Password = s(req.body.Password);
    }

    writeUsers(oldUsers.filter(x => x.UserID !== req.params.id).concat([user]));
    res.json(ok(`User ${req.params.id} has been updated.`));
});

app.delete("/User/:id", (req, res) => {
    if (typeof req.params.id !== "string") {
        res.status(404);
        res.json(error("An id must be given."))
        return;
    }

    const oldUsers = readUsers();
    const users = oldUsers.filter(x => x.UserID === req.params.id);
    if (users.length === 0) {
        res.status(404);
        res.json(error(`No user found with id '${req.params.id}'`))
        return;
    }

    writeUsers(oldUsers.filter(x => x.UserID !== req.params.id));
    res.json(ok(`User ${req.params.id} has been deleted.`));
});

app.get("*", (req, res) => res.redirect("/"));

app.use((req, res) => {
    res.status(404);
    res.json(error(`${req.path} not found`));
});

console.log("Express listening on port 3000");
app.listen(3000);
