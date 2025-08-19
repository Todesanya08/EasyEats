import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [ingredient, setIngredient] = useState("");
  const [pantry, setPantry] = useState([]);

  const [meals, setMeals] = useState([]);
  const [msg, setMsg] = useState("");     // general status/info
  const [err, setErr] = useState("");     // errors will show here

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setHealth(d))
      .catch(e => setErr("Health check failed: " + String(e)));
  }, []);

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
    e.preventDefault();
    setMsg("Registering...");
    setErr("");
    const res = await post("/api/auth/register", { username, email, password });
    console.log("register ->", res);
    setMsg(res.ok ? `✅ ${res.data.message} for ${res.data.username}` : "");
    setErr(res.ok ? "" : `❌ ${res.data.error || "Unknown error"}`);
  };

  const login = async (e) => {
    e.preventDefault();
    setMsg("Logging in...");
    setErr("");
    const res = await post("/api/auth/login", { username, password });
    console.log("login ->", res);
    setMsg(res.ok ? `✅ ${res.data.message} as ${res.data.username}` : "");
    setErr(res.ok ? "" : `❌ ${res.data.error || "Unknown error"}`);
  };

  const addPantry = async (e) => {
    e.preventDefault();
    setMsg("Adding ingredient...");
    setErr("");
    const res = await post("/api/pantry", { username, ingredient });
    console.log("addPantry ->", res);
    if (res.ok) {
      setMsg("✅ Added");
      setPantry(res.data.items || []);
      setIngredient("");
    } else {
      setErr(`❌ ${res.data.error || "Unknown error"}`);
    }
  };

  const getMeals = async () => {
    setMsg("Fetching meals...");
    setErr("");
    try {
      const r = await fetch(`/api/recommendations?username=${encodeURIComponent(username)}`);
      const d = await r.json();
      console.log("getMeals ->", d);
      setMeals(d.meals || []);
      setMsg(d.meals?.length ? "✅ Recommendations loaded" : "No meals found (add more pantry items)");
      // optional: show pantry returned by API as well
      if (Array.isArray(d.pantry)) setPantry(d.pantry);
    } catch (e) {
      setErr("❌ Failed to fetch meals: " + String(e));
    }
  };

  const box = { background:"#fff", padding:16, borderRadius:8, boxShadow:"0 2px 8px rgba(0,0,0,.08)", margin:"16px 0" };
  const input = { display:"block", width:"100%", padding:8, margin:"8px 0" };
  const btn = { padding:10, width:"100%", cursor:"pointer" };

  return (
    <div style={{ fontFamily:"Arial, sans-serif", maxWidth:560, margin:"2rem auto" }}>
      <h2>EasyEats — Sprint 1</h2>
      <p>API health: {health ? JSON.stringify(health) : "checking..."}</p>

      <section style={box}>
        <h3>Register</h3>
        <form onSubmit={register}>
          <input style={input} placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
          <input style={input} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={input} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button style={btn}>Register</button>
        </form>
      </section>

      <section style={box}>
        <h3>Login</h3>
        <form onSubmit={login}>
          <input style={input} placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
          <input style={input} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button style={btn}>Login</button>
        </form>
      </section>

      <section style={box}>
        <h3>Pantry</h3>
        <form onSubmit={addPantry}>
          <input style={input} placeholder="Ingredient (e.g., eggs)" value={ingredient} onChange={e=>setIngredient(e.target.value)} required />
          <button style={btn} disabled={!username}>Add Ingredient</button>
        </form>
        {!!pantry.length && (
          <>
            <p style={{marginTop:8}}>Current pantry for <b>{username}</b>:</p>
            <ul>{pantry.map((p,i)=><li key={i}>{p}</li>)}</ul>
          </>
        )}
      </section>

      <section style={box}>
        <h3>Basic Meal Recommendations</h3>
        <button style={btn} onClick={getMeals} disabled={!username}>Get Meals</button>
        <ul>{meals.map((m,i)=><li key={i}>{m}</li>)}</ul>
      </section>

      {msg && <p style={{color:"#155724"}}>{msg}</p>}
      {err && <p style={{color:"#b00020"}}>{err}</p>}
    </div>
  );
}

