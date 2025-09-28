import React, { useState } from "react";

// Example nutrition data per 1 egg (~50g)
const NUTRITION_DATA = {
  name: "Egg",
  servingSize: 50, // grams per serving
  calories: 72,
  protein: 6.3, // grams
  fat: 5,
  carbs: 0.4,
  source: "USDA"
};

export default function NutritionFacts() {
  const [servings, setServings] = useState(1);

  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    setServings(isNaN(val) || val < 1 ? 1 : val);
  };

  // Calculate nutrition based on servings
  const scaled = {
    calories: (NUTRITION_DATA.calories * servings).toFixed(1),
    protein: (NUTRITION_DATA.protein * servings).toFixed(1),
    fat: (NUTRITION_DATA.fat * servings).toFixed(1),
    carbs: (NUTRITION_DATA.carbs * servings).toFixed(1)
  };

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12, maxWidth: 400, boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
      <h3>{NUTRITION_DATA.name} Nutrition Facts</h3>

      <div style={{ marginBottom: 12 }}>
        <label>
          Servings:{" "}
          <input
            type="number"
            min="1"
            value={servings}
            onChange={handleChange}
            style={{ width: 60, padding: 4, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>
      </div>

      <ul style={{ listStyle: "none", padding: 0, lineHeight: 1.6 }}>
        <li><b>Calories:</b> {scaled.calories} kcal</li>
        <li><b>Protein:</b> {scaled.protein} g</li>
        <li><b>Fat:</b> {scaled.fat} g</li>
        <li><b>Carbs:</b> {scaled.carbs} g</li>
      </ul>

      <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>Source: {NUTRITION_DATA.source}</div>
    </div>
  );
}
