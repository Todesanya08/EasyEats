const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");        // npm i node-fetch@2
require("dotenv").config();                 // npm i dotenv

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "EasyEats Backend Server" });
});

// in-memory store (demo)
const users = [];          // { username, email, password }
const pantryByUser = {};   // { username: [ "eggs", "milk" ] }

// auth
app.post("/api/auth/register", (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });
    if (users.find(u => u.username === username)) return res.status(409).json({ error: "User exists" });
    users.push({ username, email, password }); // NOTE: plain for demo only
    return res.status(201).json({ message: "Registered", username });
});

app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    const u = users.find(u => u.username === username && u.password === password);
    if (!u) return res.status(401).json({ error: "Invalid credentials" });
    return res.json({ message: "Logged in", username });
});

// pantry: add single
app.post("/api/pantry", (req, res) => {
    const { username, ingredient } = req.body || {};
    if (!username || !ingredient) return res.status(400).json({ error: "Missing fields" });
    pantryByUser[username] = pantryByUser[username] || [];
    pantryByUser[username].push(String(ingredient).trim());
    res.status(201).json({ message: "Added", items: pantryByUser[username] });
});

// pantry: batch add
app.post("/api/pantry/batch", (req, res) => {
    const { username, ingredients } = req.body || {};
    if (!username || !ingredients) return res.status(400).json({ error: "Missing fields" });
    const list = String(ingredients).split(",").map(s => s.trim()).filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "No valid ingredients" });
    pantryByUser[username] = pantryByUser[username] || [];
    pantryByUser[username].push(...list);
    return res.status(201).json({ message: "Added", items: pantryByUser[username] });
});

// pantry: delete one
app.delete("/api/pantry", (req, res) => {
    const { username, ingredient } = req.body || {};
    if (!username || !ingredient) return res.status(400).json({ error: "Missing fields" });
    const items = pantryByUser[username] || [];
    const idx = items.findIndex(i => i.toLowerCase().trim() === String(ingredient).toLowerCase().trim());
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    items.splice(idx, 1);
    pantryByUser[username] = items;
    return res.json({ message: "Removed", items });
});

// pantry: read
app.get("/api/pantry/:username", (req, res) => {
    res.json({ items: pantryByUser[req.params.username] || [] });
});

// --- Sprint 2 catalog + filtering ---
const MEAL_CATALOG = [
    { name: "Scrambled Eggs", requiresAny: [["egg", "eggs"]], diet: "omnivore", contains: ["eggs"] },
    { name: "Grilled Cheese Sandwich", requiresAny: [["bread"], ["cheese"]], diet: "vegetarian", contains: ["dairy", "gluten"] },
    { name: "Simple Tomato Pasta", requiresAny: [["pasta", "spaghetti", "noodle"], ["tomato", "marinara", "sauce"]], diet: "vegan", contains: ["gluten"] },
    { name: "Avocado Toast", requiresAny: [["bread"], ["avocado"]], diet: "vegan", contains: ["gluten"] },
    { name: "Cheese Quesadilla", requiresAny: [["tortilla"], ["cheese"]], diet: "vegetarian", contains: ["dairy", "gluten"] },
    { name: "Quick Fried Rice", requiresAny: [["rice"], ["egg", "soy", "peas"]], diet: "omnivore", contains: ["eggs", "soy"] },
    { name: "Peanut Butter Sandwich", requiresAny: [["peanut", "pb"], ["bread"]], diet: "vegan", contains: ["nuts", "gluten"] },
    { name: "Simple Garden Salad", requiresAny: [["lettuce", "greens"], ["tomato", "cucumber", "carrot"]], diet: "vegan", contains: [] },
    { name: "Overnight Oats", requiresAny: [["oat", "oats", "oatmeal"], ["milk", "yogurt"]], diet: "vegetarian", contains: ["dairy"] },
];

function pantryHasAny(pantrySet, synonyms) {
    return synonyms.some(w => {
        const x = String(w).toLowerCase().trim();
        return pantrySet.has(x) || pantrySet.has(x + "s") || [...pantrySet].some(p => p.includes(x));
    });
}
function mealIsPossible(pantrySet, meal) {
    return meal.requiresAny.every(group => pantryHasAny(pantrySet, group));
}

app.get("/api/recommendations", (req, res) => {
    const { username } = req.query || {};
    const diet = String(req.query.diet || "any").toLowerCase(); // "any"|"vegetarian"|"vegan"
    const allergies = String(req.query.allergies || "")
        .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

    const pantryRaw = pantryByUser[username] || [];
    const norm = s => String(s || "").toLowerCase().trim();
    const pantrySet = new Set(pantryRaw.map(norm));

    const allowedDiet = (d) => diet === "any" ? true
        : diet === "vegetarian" ? (d === "vegetarian" || d === "vegan")
            : diet === "vegan" ? d === "vegan" : true;

    const avoidsAllergies = (m) => !allergies.length || !m.contains?.some(t => allergies.includes(t));

    let candidates = MEAL_CATALOG.filter(m => mealIsPossible(pantrySet, m));
    candidates = candidates.filter(m => allowedDiet(m.diet) && avoidsAllergies(m));

    res.json({ pantry: pantryRaw, filters: { diet: diet === "any" ? null : diet, allergies }, meals: candidates.map(m => m.name) });
});

// --- Nutrition (USDA or mock) ---
app.get("/api/nutrition", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) return res.status(400).json({ error: "Missing query ?q=" });

        if (!process.env.FDC_API_KEY) {
            // mock so you can demo without a key
            const MOCKS = {
                egg: { calories: 155, protein_g: 13, fat_g: 11, carbs_g: 1.1 },
                avocado: { calories: 160, protein_g: 2, fat_g: 15, carbs_g: 9 },
                bread: { calories: 265, protein_g: 9, fat_g: 3.2, carbs_g: 49 },
                cheese: { calories: 402, protein_g: 25, fat_g: 33, carbs_g: 1.3 },
            };
            const hit = MOCKS[q.toLowerCase()] || { calories: 100, protein_g: 3, fat_g: 3, carbs_g: 15 };
            return res.json({ food: q, per_100g: hit, source: "mock" });
        }

        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.FDC_API_KEY}&query=${encodeURIComponent(q)}&pageSize=1`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`USDA API ${r.status}`);
        const data = await r.json();
        const first = data.foods?.[0];
        if (!first) return res.json({ food: q, per_100g: null, source: "usda", note: "no match" });

        const getN = (needle) => {
            const n = (first.foodNutrients || []).find(n => (n.nutrientName || "").toLowerCase().includes(needle));
            return n ? n.value : null;
            // energy may be kcal or kJ depending on dataset
        };

        res.json({
            food: first.description || q,
            per_100g: {
                calories: getN("energy") || getN("calorie"),
                protein_g: getN("protein"),
                fat_g: getN("fat"),
                carbs_g: getN("carbohydrate"),
            },
            source: "usda",
            fdcId: first.fdcId,
        });
    } catch (e) {
        console.error("nutrition error:", e);
        res.status(500).json({ error: "Failed to fetch nutrition" });
    }
});

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
