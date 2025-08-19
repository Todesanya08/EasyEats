const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// health check route
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "EasyEats Backend Server" });
});
// --- Simple in-memory storage for Sprint 1 demo ---
const users = [];              // { username, email, password }
const pantryByUser = {};       // { username: [ "eggs", "milk" ] }

// Register
app.post("/api/auth/register", (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });
    if (users.find(u => u.username === username)) return res.status(409).json({ error: "User exists" });
    users.push({ username, email, password }); // NOTE: plain for demo; hash later
    return res.status(201).json({ message: "Registered", username });
});

// Login
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    const u = users.find(u => u.username === username && u.password === password);
    if (!u) return res.status(401).json({ error: "Invalid credentials" });
    return res.json({ message: "Logged in", username });
});

// Add pantry item
app.post("/api/pantry", (req, res) => {
    const { username, ingredient } = req.body || {};
    if (!username || !ingredient) return res.status(400).json({ error: "Missing fields" });
    pantryByUser[username] = pantryByUser[username] || [];
    pantryByUser[username].push(ingredient);
    res.status(201).json({ message: "Added", items: pantryByUser[username] });
});
// Recommendations (very basic)
app.get("/api/recommendations", (req, res) => {
    const { username } = req.query || {};
    const pantry = (pantryByUser[username] || []).map(x => x.toLowerCase());
    const meals = [];
    const has = (x) => pantry.includes(x);
    if (has("eggs") || has("egg")) meals.push("Scrambled Eggs");
    if (has("bread") && has("cheese")) meals.push("Grilled Cheese Sandwich");
    if (has("pasta") && has("tomato")) meals.push("Simple Tomato Pasta");
    res.json({ pantry, meals });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});
