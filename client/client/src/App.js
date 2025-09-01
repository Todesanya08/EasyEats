import { Fragment, useEffect, useState } from "react";

export default function App() {
    const [health, setHealth] = useState(null);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [ingredient, setIngredient] = useState("");
    const [batch, setBatch] = useState("");
    const [pantry, setPantry] = useState([]);

    const [diet, setDiet] = useState("any");        // "any" | "vegetarian" | "vegan"
    const [allergies, setAllergies] = useState(""); // comma list

    const [meals, setMeals] = useState([]);
    const [nutrition, setNutrition] = useState(null);
    const [nutritionQuery, setNutritionQuery] = useState("");

    const [servings, setServings] = useState(1);
    const [gramsPerServing, setGramsPerServing] = useState(100);

    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [plan, setPlan] = useState(Object.fromEntries(days.map(d => [d, ""])));

    useEffect(() => {
        fetch("/api/health").then(r => r.json()).then(setHealth).catch(e => setErr("Health check failed: " + e));
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!username) return;
            try {
                const r = await fetch(`/api/pantry/${encodeURIComponent(username)}`);
                const d = await r.json();
                if (Array.isArray(d.items)) setPantry(d.items);
            } catch { }
        };
        load();
    }, [username]);

    const post = async (url, body) => {
        try {
            const r = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await r.json().catch(() => ({}));
            return { ok: r.ok, data };
        } catch (e) {
            setErr("Network error: " + String(e));
            return { ok: false, data: { error: String(e) } };
        }
    };

    const register = async (e) => {
        e.preventDefault(); setMsg("Registering..."); setErr("");
        const res = await post("/api/auth/register", { username, email, password });
        setMsg(res.ok ? `✅ ${res.data.message} for ${res.data.username}` : "");
        setErr(res.ok ? "" : `❌ ${res.data.error || "Unknown error"}`);
    };

    const login = async (e) => {
        e.preventDefault(); setMsg("Logging in..."); setErr("");
        const res = await post("/api/auth/login", { username, password });
        setMsg(res.ok ? `✅ ${res.data.message} as ${res.data.username}` : "");
        setErr(res.ok ? "" : `❌ ${res.data.error || "Unknown error"}`);
        if (res.ok) {
            try {
                const r = await fetch(`/api/pantry/${encodeURIComponent(username)}`);
                const d = await r.json();
                if (Array.isArray(d.items)) setPantry(d.items);
            } catch { }
        }
    };

    const addPantry = async (e) => {
        e.preventDefault(); setMsg("Adding ingredient..."); setErr("");
        const res = await post("/api/pantry", { username, ingredient });
        if (res.ok) { setPantry(res.data.items || []); setIngredient(""); setMsg("✅ Added"); }
        else setErr(`❌ ${res.data.error || "Unknown error"}`);
    };

    const addBatch = async (e) => {
        e.preventDefault(); setMsg("Adding multiple ingredients..."); setErr("");
        try {
            const r = await fetch("/api/pantry/batch", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, ingredients: batch })
            });
            const data = await r.json();
            if (r.ok) { setPantry(data.items || []); setBatch(""); setMsg("✅ Added multiple ingredients"); }
            else setErr(`❌ ${data.error || "Batch add failed"}`);
        } catch (e) { setErr("❌ Network error: " + String(e)); }
    };

    const removeItem = async (ing) => {
        setMsg(""); setErr("");
        try {
            const r = await fetch("/api/pantry", {
                method: "DELETE", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, ingredient: ing })
            });
            const data = await r.json();
            if (r.ok) { setPantry(data.items || []); setMsg(`🗑️ Removed "${ing}"`); }
            else setErr(`❌ ${data.error || "Delete failed"}`);
        } catch (e) { setErr("❌ Network error: " + String(e)); }
    };

    const getMeals = async () => {
        setMsg("Fetching meals..."); setErr("");
        try {
            const params = new URLSearchParams({ username, diet, allergies });
            const r = await fetch(`/api/recommendations?${params.toString()}`);
            const d = await r.json();
            setMeals(d.meals || []);
            setMsg(d.meals?.length ? "✅ Recommendations loaded" : "No meals found (adjust filters or add items)");
            if (Array.isArray(d.pantry)) setPantry(d.pantry);
        } catch (e) { setErr("❌ Failed to fetch meals: " + String(e)); }
    };

    const lookupNutrition = async () => {
        setMsg("Looking up nutrition..."); setErr("");
        try {
            const r = await fetch(`/api/nutrition?q=${encodeURIComponent(nutritionQuery)}`);
            const d = await r.json();
            if (d.error) { setErr("❌ " + d.error); return; }
            setNutrition(d); setMsg("✅ Nutrition loaded");
        } catch (e) { setErr("❌ Failed to load nutrition: " + String(e)); }
    };

    const box = { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.08)", margin: "16px 0" };
    const input = { display: "block", width: "100%", padding: 8, margin: "8px 0" };
    const btn = { padding: 10, width: "100%", cursor: "pointer" };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 680, margin: "2rem auto" }}>
            <h2>EasyEats — Sprint 2</h2>
            <p>API health: {health ? JSON.stringify(health) : "checking..."}</p>

            <section style={box}>
                <h3>Register</h3>
                <form onSubmit={register}>
                    <input style={input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                    <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input style={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button style={btn}>Register</button>
                </form>
            </section>

            <section style={box}>
                <h3>Login</h3>
                <form onSubmit={login}>
                    <input style={input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                    <input style={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button style={btn}>Login</button>
                </form>
            </section>

            <section style={box}>
                <h3>Pantry</h3>

                <form onSubmit={addPantry}>
                    <input style={input} placeholder="Ingredient (e.g., eggs)" value={ingredient} onChange={e => setIngredient(e.target.value)} required disabled={!username} />
                    <button style={btn} disabled={!username}>Add Ingredient</button>
                </form>

                <form onSubmit={addBatch} style={{ marginTop: 8 }}>
                    <input style={input} placeholder="Add multiple (e.g., bread, cheese, pasta)" value={batch} onChange={e => setBatch(e.target.value)} disabled={!username} />
                    <button style={btn} disabled={!username || !batch.trim()}>Add Batch</button>
                </form>

                {!!pantry.length && (
                    <>
                        <p style={{ marginTop: 8 }}>Current pantry for <b>{username}</b>:</p>
                        <ul>
                            {pantry.map((p, i) => (
                                <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>{p}</span>
                                    <button onClick={() => removeItem(p)} style={{ padding: "4px 8px", marginLeft: 8 }}>Remove</button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <section style={box}>
                <h3>Meal Recommendations</h3>

                <div style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <label>
                        Diet:&nbsp;
                        <select value={diet} onChange={e => setDiet(e.target.value)}>
                            <option value="any">Any</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                        </select>
                    </label>

                    <label>
                        Allergies (comma-separated):&nbsp;
                        <input style={{ padding: 4 }} placeholder="nuts,dairy,gluten" value={allergies} onChange={e => setAllergies(e.target.value)} />
                    </label>
                </div>

                <button style={btn} onClick={getMeals} disabled={!username}>Get Meals</button>
                <ul>{meals.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </section>

            <section style={box}>
                <h3>Nutrition Facts (per 100g)</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input style={input} placeholder="Try 'avocado' or 'bread'" value={nutritionQuery} onChange={e => setNutritionQuery(e.target.value)} />
                    <button style={btn} onClick={lookupNutrition} disabled={!nutritionQuery.trim()}>Lookup</button>
                </div>

                {nutrition && nutrition.per_100g && (
                    <ul style={{ marginTop: 8 }}>
                        <li><b>Food:</b> {nutrition.food}</li>
                        <li><b>Calories:</b> {nutrition.per_100g.calories ?? "—"}</li>
                        <li><b>Protein (g):</b> {nutrition.per_100g.protein_g ?? "—"}</li>
                        <li><b>Fat (g):</b> {nutrition.per_100g.fat_g ?? "—"}</li>
                        <li><b>Carbs (g):</b> {nutrition.per_100g.carbs_g ?? "—"}</li>
                        <li><i>Source: {nutrition.source}</i></li>
                    </ul>
                )}
                {nutrition && !nutrition.per_100g && <p>No nutrition found for this item.</p>}

                {nutrition?.per_100g && (
                    <div style={{ marginTop: 12 }}>
                        <h4>Portion Calculator</h4>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <label>Servings:
                                <input type="number" min="1" value={servings} onChange={e => setServings(Number(e.target.value) || 1)} style={{ marginLeft: 6, width: 80 }} />
                            </label>
                            <label>Grams / serving:
                                <input type="number" min="1" value={gramsPerServing} onChange={e => setGramsPerServing(Number(e.target.value) || 100)} style={{ marginLeft: 6, width: 120 }} />
                            </label>
                        </div>
                        {(() => {
                            const factor = (servings * gramsPerServing) / 100;
                            const per = nutrition.per_100g;
                            const fmt = (x) => (x == null ? "—" : Math.round(x * factor));
                            return (
                                <ul style={{ marginTop: 8 }}>
                                    <li><b>Total Calories:</b> {fmt(per.calories)}</li>
                                    <li><b>Total Protein (g):</b> {fmt(per.protein_g)}</li>
                                    <li><b>Total Fat (g):</b> {fmt(per.fat_g)}</li>
                                    <li><b>Total Carbs (g):</b> {fmt(per.carbs_g)}</li>
                                </ul>
                            );
                        })()}
                    </div>
                )}
            </section>

            <section style={box}>
                <h3>Weekly Meal Planner</h3>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8 }}>
                    {days.map(d => (
                        <Fragment key={d}>
                            <div style={{ fontWeight: "bold" }}>{d}</div>
                            <input
                                style={input}
                                placeholder="e.g., Avocado Toast (2 servings)"
                                value={plan[d]}
                                onChange={e => setPlan(p => ({ ...p, [d]: e.target.value }))}
                            />
                        </Fragment>
                    ))}
                </div>
            </section>

            {msg && <p style={{ color: "#155724" }}>{msg}</p>}
            {err && <p style={{ color: "#b00020" }}>{err}</p>}
        </div>
    );
}

