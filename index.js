// index.js (CommonJS)
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcryptjs");
const SALT_ROUNDS = 12;
const cors = require("cors");

(async () => {
  const app = express();

  app.use(cors({
    origin: [
      "https://httpie.io",
      "https://web.httpie.io"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.use(express.json());

  const db = await open({ filename: "todo.db", driver: sqlite3.Database });
  await db.exec(`

      CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
  );
    
    
    CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY,
    text TEXT,
    done INT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `
  );


  app.get("/todos", async (req, res) => {
    res.json(await db.all("SELECT * FROM todos"));
  });


  app.post("/todos", async (req, res) => {
    const { text, user_id } = req.body;
    const result = await db.run("INSERT INTO todos (text, user_id, done) VALUES (?, ?, 0)", text, user_id);
    res.status(201).json({ id: result.lastID, text, done: 0 });
  });

  app.post("/user", async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash]);
    res.status(201).json({ id: result.lastID, username });
  });


  app.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const row = await db.get("SELECT id, username, password FROM users WHERE username = ?", [username]);
      if (!row) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await bcrypt.compare(password, row.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      return res.json({ id: row.id, username: row.username });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.get("user/todos/:user_id", async (req, res) => {
    const { user_id } = req.params;
    const todos = await db.all("SELECT * FROM todos WHERE user_id=?", user_id);
    res.json(todos);
  });

  app.delete("/todos/:id", async (req, res) => {
    await db.run("DELETE FROM todos WHERE id=?", req.params.id);
    res.sendStatus(204);
  });


  app.patch("/todos/:id", async (req, res) => {
    const { done } = req.body;
    await db.run("UPDATE todos SET done=? WHERE id=?", done ? 1 : 0, req.params.id);
    res.sendStatus(204);
  });




  app.listen(3000, () => console.log("http://localhost:3000"));
})();
