// MapGroceriesAlternative.jsx
import React, { useEffect, useState } from "react";

/*
  - Geocodes a user-entered location (or uses browser geolocation).
  - Uses Overpass API to query nearby shops (supermarket, grocery, convenience).
  - Renders a polished list with distance, address, and actions.
  - Optional prop onSelectPlace(place) will be called with { lat, lon, name } when user clicks Focus.
*/

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function haversineMeters(a, b) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MapGroceriesAlternative({ onSelectPlace } = {}) {
    const [query, setQuery] = useState("");
    const [center, setCenter] = useState(null); // { lat, lon, label }
    const [radius, setRadius] = useState(2000); // meters
    const [results, setResults] = useState([]); // array of { id, name, lat, lon, tags, distanceMeters }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // geolocation hook left intentionally empty — user triggers with button
    useEffect(() => {
        if (!navigator.geolocation) return;
    }, []);

    // helper: geocode via Nominatim
    async function geocode(q) {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=5`;
        const res = await fetch(url, { headers: { "User-Agent": "easy-eats-demo/1.0" } });
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        if (!data.length) throw new Error("Location not found");
        const s = data[0];
        return { lat: Number(s.lat), lon: Number(s.lon), label: s.display_name };
    }

    // helper: Overpass query for shops near lat/lon within radius
    async function overpassSearch(lat, lon, radiusMeters = 2000) {
        const q = `
      [out:json][timeout:25];
      (
        node["shop"~"^(supermarket|grocery|convenience)$"](around:${radiusMeters},${lat},${lon});
        way["shop"~"^(supermarket|grocery|convenience)$"](around:${radiusMeters},${lat},${lon});
        relation["shop"~"^(supermarket|grocery|convenience)$"](around:${radiusMeters},${lat},${lon});
      );
      out center tags;
    `;
        const res = await fetch(OVERPASS_URL, {
            method: "POST",
            body: q,
            headers: { "Content-Type": "text/plain" },
        });
        if (!res.ok) throw new Error("Overpass query failed");
        const json = await res.json();
        return json.elements || [];
    }

    async function handleSearchByText(e) {
        e && e.preventDefault && e.preventDefault();
        setError("");
        setResults([]);
        setLoading(true);
        try {
            const place = await geocode(query || "Indianapolis, IN");
            setCenter(place);
            const elems = await overpassSearch(place.lat, place.lon, radius);
            const items = elems
                .map((el) => {
                    const lat = el.lat ?? (el.center && el.center.lat);
                    const lon = el.lon ?? (el.center && el.center.lon);
                    if (lat == null || lon == null) return null;
                    return {
                        id: `${el.type}/${el.id}`,
                        name: el.tags?.name || (el.tags?.brand ? `${el.tags.brand} store` : "Unnamed"),
                        tags: el.tags || {},
                        lat,
                        lon,
                    };
                })
                .filter(Boolean)
                .map((it) => ({ ...it, distanceMeters: Math.round(haversineMeters({ lat: place.lat, lon: place.lon }, it)) }))
                .sort((a, b) => a.distanceMeters - b.distanceMeters);
            setResults(items);
        } catch (err) {
            console.error(err);
            setError(err.message || "Search failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleUseMyLocation() {
        setError("");
        setResults([]);
        setLoading(true);
        try {
            if (!navigator.geolocation) throw new Error("Geolocation not available in this browser");
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
            const revRes = await fetch(revUrl, { headers: { "User-Agent": "easy-eats-demo/1.0" } });
            const revJson = await revRes.json().catch(() => ({}));
            const label = revJson.display_name || "Current location";
            setCenter({ lat, lon, label });
            const elems = await overpassSearch(lat, lon, radius);
            const items = elems
                .map((el) => {
                    const lat2 = el.lat ?? (el.center && el.center.lat);
                    const lon2 = el.lon ?? (el.center && el.center.lon);
                    if (lat2 == null || lon2 == null) return null;
                    return {
                        id: `${el.type}/${el.id}`,
                        name: el.tags?.name || (el.tags?.brand ? `${el.tags.brand} store` : "Unnamed"),
                        tags: el.tags || {},
                        lat: lat2,
                        lon: lon2,
                    };
                })
                .filter(Boolean)
                .map((it) => ({ ...it, distanceMeters: Math.round(haversineMeters({ lat, lon }, it)) }))
                .sort((a, b) => a.distanceMeters - b.distanceMeters);
            setResults(items);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to get location");
        } finally {
            setLoading(false);
        }
    }

    function handleFocus(item) {
        if (onSelectPlace && typeof onSelectPlace === "function") {
            onSelectPlace({ lat: item.lat, lon: item.lon, name: item.name });
        } else {
            const q = `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=18/${item.lat}/${item.lon}`;
            window.open(q, "_blank", "noopener noreferrer");
        }
    }

    const formatDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

    // styles
    const containerStyle = { background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" };
    const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", width: "100%" };
    const buttonPrimary = { background: "#2563eb", color: "#fff", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer" };
    const buttonGhost = { background: "#fff", color: "#374151", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" };

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                    {/* intentionally no H3 here — parent should provide the section title */}
                </div>

                <div style={{ minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={buttonPrimary} onClick={handleUseMyLocation}>Use my location</button>
                        <button
                            style={buttonGhost}
                            onClick={() => {
                                setResults([]);
                                setCenter(null);
                                setError("");
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearchByText} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    placeholder="Enter city, address or postcode (e.g., Indianapolis)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={inputStyle}
                />
                <button style={buttonPrimary} type="submit">Search</button>
            </form>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <label style={{ color: "#374151" }}>Radius:</label>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ padding: 8, borderRadius: 8 }}>
                    <option value={1000}>1 km</option>
                    <option value={2000}>2 km</option>
                    <option value={5000}>5 km</option>
                </select>
                <div style={{ marginLeft: "auto", color: "#6b7280" }}>
                    {center ? `Center: ${center.label ?? `${center.lat.toFixed(3)},${center.lon.toFixed(3)}`}` : "No center"}
                </div>
            </div>

            {loading && <div style={{ color: "#6b7280", marginBottom: 12 }}>Searching for nearby stores…</div>}
            {error && <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
                <div>
                    {results.length === 0 && !loading && <div style={{ color: "#6b7280" }}>No stores found yet. Try search or use your location.</div>}

                    <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                        {results.map((r) => (
                            <div key={r.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", alignItems: "center" }}>
                                <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3h18v2H3z" fill="#e5e7eb" />
                                        <path d="M6 7h12v13H6z" fill="#f8fafc" />
                                        <path d="M9 10h6v2H9z" fill="#e5e7eb" />
                                    </svg>
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                        <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                                        <div style={{ textAlign: "right", color: "#6b7280", fontSize: 13 }}>{formatDistance(r.distanceMeters)}</div>
                                    </div>

                                    <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {r.tags?.addr_full || r.tags?.addr_street || ""}
                                        {r.tags?.addr_city ? ` • ${r.tags.addr_city}` : ""}
                                    </div>

                                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + (r.tags?.addr_street || ""))}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ padding: "6px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#2563eb", textDecoration: "none" }}
                                        >
                                            Open in Google Maps
                                        </a>

                                        <button
                                            onClick={() => handleFocus(r)}
                                            style={{ padding: "6px 10px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
                                        >
                                            Focus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside style={{ background: "#fafafc", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Summary</div>
                    <div style={{ color: "#374151", marginBottom: 6 }}>{results.length ? `${results.length} stores found` : "No stores found"}</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>Radius: {radius / 1000} km</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Notes</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                        Results are sourced from OpenStreetMap / Overpass API. If you see few results, try increasing the radius or search a city center.
                    </div>
                </aside>
            </div>
        </div>
    );
}

// helper used inline
function formatDistance(m) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}
