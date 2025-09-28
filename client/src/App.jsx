import React, { Fragment, useEffect, useState } from "react";
import MapGroceries from "./components/MapGroceries";
import HelpSupport from "./components/HelpSupport";
import NutritionFacts from "./components/NutritionFacts";

export default function App() {
  const [health, setHealth] = useState(null);

  // --- AUTH ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- PANTRY ---
  const [ingredient, setIngredient] = useState("");
  const [batch, setBatch] = useState("");
  const [pantry, setPantry] = useState([]);

  // --- MEALS / FILTERS ---
  const [diet, setDiet] = useState("any");
  const [allergies, setAllergies] = useState("");
  const [meals, setMeals] = useState([]);

  // --- NUTRITION ---
  const [nutritionQuery, setNutritionQuery] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [servings, setServings] = useState(1);
  const [gramsPerServing, setGramsPerServing] = useState(100);

  // --- WEEKLY PLANNER ---
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [plan, setPlan] = useState(Object.fromEntries(days.map(d => [d, ""])));

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // --- STYLES ---
  const container = { fontFamily: "Arial, sans-serif", maxWidth: 720, margin: "2rem auto", background: "#f4f4f8", padding: 16 };
  const card = { background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)", margin: "16px 0" };
  const input = { display: "block", width: "100%", padding: 10, margin: "8px 0", borderRadius: 6, border: "1px solid #ccc" };
  const button = { padding: 10, width: "100%", cursor: "pointer", borderRadius: 6, border: "none", backgroundColor: "#4caf50", color: "#fff" };
  const buttonDanger = { ...button, backgroundColor: "#f44336" };
  const sectionTitle = { marginBottom: 12, color: "#333" };
  const textSmall = { fontSize: 14, color: "#555" };
  const hoverGreen = (e) => e.currentTarget.style.backgroundColor = "#45a049";
  const leaveGreen = (e) => e.currentTarget.style.backgroundColor = "#4caf50";
  const hoverRed = (e) => e.currentTarget.style.backgroundColor = "#d32f2f";
  const leaveRed = (e) => e.currentTarget.style.backgroundColor = "#f44336";

  // --- API / UTILITY FUNCTIONS ---
  const post = async (url, body) => {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, data };
    } catch (e) {
      setErr("Network error: " + String(e));
      return { ok: false, data: { error: String(e) } };
    }
  };

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(setHealth)
      .catch(e => setErr("Health check failed: " + String(e)));
  }, []);

  useEffect(() => {
    const loadPantry = async () => {
      if (!username) return;
      try {
        const r = await fetch(`/api/pantry/${encodeURIComponent(username)}`);
        const d = await r.json();
        if (Array.isArray(d.items)) setPantry(d.items);
      } catch { }
    };
    loadPantry();
  }, [username]);

  const register = async (e) => {
    e.preventDefault();
    setMsg("Registering...");
    setErr("");
    const res = await post("/api/auth/register", { username, email, password });
    setMsg(res.ok ? `✅ Registered ${res.data.username}` : "");
    setErr(res.ok ? "" : `❌ ${res.data.error || "Unknown error"}`);
  };

  const login = async (e) => {
    e.preventDefault();
    setMsg("Logging in...");
    setErr("");
    const res = await post("/api/auth/login", { username, password });
    setMsg(res.ok ? `✅ Logged in as ${res.data.username}` : "");
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
    e.preventDefault(); setMsg(""); setErr("");
    const res = await post("/api/pantry", { username, ingredient });
    if (res.ok) { setPantry(res.data.items || []); setIngredient(""); setMsg("✅ Added"); }
    else setErr(`❌ ${res.data.error || "Unknown error"}`);
  };

  const addBatch = async (e) => {
    e.preventDefault(); setMsg(""); setErr("");
    try {
      const r = await fetch("/api/pantry/batch", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, ingredients: batch })
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
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, ingredient: ing })
      });
      const data = await r.json();
      if (r.ok) { setPantry(data.items || []); setMsg(`🗑️ Removed "${ing}"`); }
      else setErr(`❌ ${data.error || "Delete failed"}`);
    } catch (e) { setErr("❌ Network error: " + String(e)); }
  };

    const getMeals = async () => {
        setMsg("Generating meal recommendations...");
        setErr("");
        setMeals([]);

        try {
            if (!pantry.length) {
                setErr("❌ Your pantry is empty. Add ingredients first.");
                return;
            }

            // Dynamic combination of pantry ingredients
            const generatedMeals = [];
            for (let i = 0; i < pantry.length; i++) {
                for (let j = i + 1; j < pantry.length; j++) {
                    generatedMeals.push(`${pantry[i]} & ${pantry[j]} Salad`);
                    generatedMeals.push(`${pantry[i]} + ${pantry[j]} Stir Fry`);
                    generatedMeals.push(`${pantry[i]} and ${pantry[j]} Wrap`);
                }
            }

            // Optional: random shuffle and limit to 15-20 suggestions
            const shuffled = generatedMeals.sort(() => Math.random() - 0.5).slice(0, 20);

            setMeals(shuffled);
            setMsg(shuffled.length ? `✅ ${shuffled.length} meals generated` : "No meals could be generated");
        } catch (e) {
            setErr("❌ Failed to generate meals: " + String(e));
        }
    };


  const lookupNutrition = async () => {
    setMsg("Looking up nutrition..."); setErr(""); setNutrition(null);
    try {
      const r = await fetch(`/api/nutrition?q=${encodeURIComponent(nutritionQuery)}`);
      const d = await r.json();
      if (d.error) { setErr("❌ " + d.error); return; }
      setNutrition(d); setMsg("✅ Nutrition loaded");
    } catch (e) { setErr("❌ Failed to load nutrition: " + String(e)); }
  };

  return (
    <div style={container}>
          <div style={{
              textAlign: "center",
              padding: "2rem 1rem",
              borderRadius: 12,
              marginBottom: "2rem",
              background: "linear-gradient(135deg, #16a34a, #4ade80, #86efac)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
              <h1 style={{
                  textAlign: "center",
                  fontSize: 36,
                  fontWeight: "bold",
                  margin: "24px 0",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #16a34a, #4ade80, #86efac)",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.4)"
              }}>
                  EasyEats 🍳
              </h1>
              <p style={{ fontSize: "1.2rem", marginTop: 8 }}>
                  Your smart meal planner & grocery companion
              </p>
          </div>


      {/* --- REGISTER --- */}
      <section style={card}>
        <h3 style={sectionTitle}>Register</h3>
        <form onSubmit={register}>
          <input style={input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={button} onMouseEnter={hoverGreen} onMouseLeave={leaveGreen}>Register</button>
        </form>
      </section>

      {/* --- LOGIN --- */}
      <section style={card}>
        <h3 style={sectionTitle}>Login</h3>
        <form onSubmit={login}>
          <input style={input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input style={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={button} onMouseEnter={hoverGreen} onMouseLeave={leaveGreen}>Login</button>
        </form>
      </section>

      {/* --- PANTRY --- */}
      <section style={card}>
        <h3 style={sectionTitle}>Pantry</h3>
        <form onSubmit={addPantry}>
          <input style={input} placeholder="Ingredient" value={ingredient} onChange={e => setIngredient(e.target.value)} disabled={!username} />
          <button style={button} disabled={!username}>Add Ingredient</button>
        </form>
        <form onSubmit={addBatch}>
          <input style={input} placeholder="Add multiple (comma-separated)" value={batch} onChange={e => setBatch(e.target.value)} disabled={!username} />
          <button style={button} disabled={!username || !batch.trim()}>Add Batch</button>
        </form>
        <ul>
          {pantry.map((p, i) => (
            <li key={i} style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
              <span>{p}</span>
              <button style={buttonDanger} onClick={() => removeItem(p)} onMouseEnter={hoverRed} onMouseLeave={leaveRed}>Remove</button>
            </li>
          ))}
        </ul>
      </section>

          {/* --- MEALS --- */}
          <section style={card}>
              <h3 style={sectionTitle}>Meal Recommendations</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <label>Diet:
                      <select
                          value={diet}
                          onChange={e => setDiet(e.target.value)}
                          style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
                      >
                          <option value="any">Any</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="vegan">Vegan</option>
                      </select>
                  </label>
                  <label>Allergies:
                      <input
                          style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
                          placeholder="e.g., nuts,dairy"
                          value={allergies}
                          onChange={e => setAllergies(e.target.value)}
                      />
                  </label>
              </div>
              <button
                  style={button}
                  onMouseEnter={hoverGreen}
                  onMouseLeave={leaveGreen}
                  onClick={getMeals}
                  disabled={!username}
              >
                  Get Meals
              </button>

              <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                  {meals.length === 0 && <li style={{ color: "#555" }}>No meals found yet.</li>}
                  {meals.map((m, i) => (
                      <li
                          key={i}
                          style={{
                              background: "#fff",
                              padding: 12,
                              borderRadius: 8,
                              marginBottom: 8,
                              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                          }}
                      >
                          <div style={{ fontWeight: "bold" }}>{m.name || m}</div>
                          {m.ingredients && <div style={{ fontSize: 13, color: "#555" }}>Ingredients: {m.ingredients.join(", ")}</div>}
                          {m.instructions && <div style={{ fontSize: 13, color: "#555" }}>Instructions: {m.instructions}</div>}
                      </li>
                  ))}
              </ul>

          </section>


          {/* --- NUTRITION --- */}
          <section style={card}>
              <h3 style={sectionTitle}>Nutrition Facts</h3>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                      style={{ ...input, maxWidth: 320 }}
                      placeholder="e.g., avocado"
                      value={nutritionQuery}
                      onChange={e => setNutritionQuery(e.target.value)}
                  />
                  <button
                      style={button}
                      onMouseEnter={hoverGreen}
                      onMouseLeave={leaveGreen}
                      onClick={lookupNutrition}
                      disabled={!nutritionQuery.trim()}
                  >
                      Lookup
                  </button>
              </div>

              {nutrition && nutrition.per_100g && (
                  <>
                      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                          <label>
                              Servings:
                              <input
                                  type="number"
                                  min="1"
                                  value={servings}
                                  onChange={e => setServings(Number(e.target.value))}
                                  style={{ ...input, maxWidth: 100 }}
                              />
                          </label>
                          <label>
                              Grams per serving:
                              <input
                                  type="number"
                                  min="1"
                                  value={gramsPerServing}
                                  onChange={e => setGramsPerServing(Number(e.target.value))}
                                  style={{ ...input, maxWidth: 120 }}
                              />
                          </label>
                      </div>

                      {/* Calculate actual nutrients */}
                      {(() => {
                          const totalGrams = servings * gramsPerServing;
                          const cals = ((nutrition.per_100g.calories ?? 0) * totalGrams) / 100;
                          const protein = ((nutrition.per_100g.protein_g ?? 0) * totalGrams) / 100;
                          const fat = ((nutrition.per_100g.fat_g ?? 0) * totalGrams) / 100;
                          const carbs = ((nutrition.per_100g.carbs_g ?? 0) * totalGrams) / 100;

                          return (
                              <div
                                  style={{
                                      border: "2px solid #000",
                                      padding: 12,
                                      marginTop: 16,
                                      background: "#fff",
                                      maxWidth: 300,
                                      borderRadius: 8
                                  }}
                              >
                                  <h2 style={{ fontSize: 20, fontWeight: "bold", borderBottom: "8px solid #000", marginBottom: 8 }}>
                                      Nutrition Facts
                                  </h2>
                                  <p style={{ borderBottom: "1px solid #000", margin: "4px 0", fontWeight: "bold" }}>
                                      Serving size: {gramsPerServing} g × {servings} = {totalGrams} g
                                  </p>
                                  <p style={{ fontSize: 16, fontWeight: "bold", margin: "4px 0" }}>
                                      Calories: {cals.toFixed(0)}
                                  </p>
                                  <hr style={{ borderTop: "4px solid #000", margin: "8px 0" }} />
                                  <p style={{ margin: "4px 0" }}><b>Protein:</b> {protein.toFixed(1)} g</p>
                                  <p style={{ margin: "4px 0" }}><b>Fat:</b> {fat.toFixed(1)} g</p>
                                  <p style={{ margin: "4px 0" }}><b>Carbs:</b> {carbs.toFixed(1)} g</p>
                                  <p style={{ marginTop: 8, fontSize: 12, color: "#555" }}>Source: {nutrition.source}</p>
                              </div>
                          );
                      })()}
                  </>
              )}
          </section>

      {/* --- WEEKLY PLANNER --- */}
      <section style={card}>
        <h3 style={sectionTitle}>Weekly Meal Planner</h3>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8 }}>
          {days.map(d => (
            <Fragment key={d}>
              <div style={{ fontWeight: "bold" }}>{d}</div>
              <input style={input} placeholder="e.g., Avocado Toast" value={plan[d]} onChange={e => setPlan(p => ({ ...p, [d]: e.target.value }))} />
            </Fragment>
          ))}
        </div>
      </section>

      {/* --- MAPS --- */}
      <section style={card}><h3 style={sectionTitle}>Nearby Grocery Stores</h3><MapGroceries /></section>

      {/* --- HELP SUPPORT --- */}
      <section style={card}><HelpSupport /></section>

      {/* --- MESSAGES --- */}
      {msg && <p style={{ color: "#155724" }}>{msg}</p>}
      {err && <p style={{ color: "#b00020" }}>{err}</p>}
    </div>
  );
}
