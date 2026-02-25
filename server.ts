import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("aquaguard.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    status TEXT DEFAULT 'Safe',
    humidity REAL DEFAULT 45.0,
    water_presence INTEGER DEFAULT 0,
    temperature REAL DEFAULT 20.0
  );
`);

// Seed data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "password123");
}

const locationCount = db.prepare("SELECT count(*) as count FROM locations").get() as { count: number };
if (locationCount.count === 0) {
  db.prepare("INSERT INTO locations (name, status, humidity, water_presence, temperature) VALUES (?, ?, ?, ?, ?)").run("Main Kitchen", "Safe", 42.5, 0, 21.0);
  db.prepare("INSERT INTO locations (name, status, humidity, water_presence, temperature) VALUES (?, ?, ?, ?, ?)").run("Basement Utility", "Safe", 68.2, 0, 18.5);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { username: (user as any).username } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/locations", (req, res) => {
    const locations = db.prepare("SELECT * FROM locations").all();
    res.json(locations);
  });

  app.post("/api/locations", (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO locations (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid, name, status: 'Safe', humidity: 45.0, water_presence: 0, temperature: 20.0 });
  });

  app.patch("/api/locations/:id/simulate", (req, res) => {
    const { id } = req.params;
    const { status, humidity, water_presence, temperature } = req.body;
    db.prepare("UPDATE locations SET status = ?, humidity = ?, water_presence = ?, temperature = ? WHERE id = ?")
      .run(status, humidity, water_presence, temperature, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
