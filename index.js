// index.js (CommonJS)
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

(async () => {
    const app = express();
    app.use(express.json());

    const db = await open({ filename: "todo.db", driver: sqlite3.Database });
    await db.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY,
    text TEXT,
    done INT
  )`);

    app.get("/todos", async (req, res) => {
        res.json(await db.all("SELECT * FROM todos"));
    });

    app.post("/todos", async (req, res) => {
        const { text } = req.body;
        const result = await db.run("INSERT INTO todos (text, done) VALUES (?, 0)", text);
        res.status(201).json({ id: result.lastID, text, done: 0 });
    });

    app.patch("/todos/:id", async (req, res) => {
        const { done } = req.body;
        await db.run("UPDATE todos SET done=? WHERE id=?", done ? 1 : 0, req.params.id);
        res.sendStatus(204);
    });

    app.listen(3000, () => console.log("http://localhost:3000"));
})();
