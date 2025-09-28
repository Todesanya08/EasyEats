import React, { useState } from "react";

// Example data: per 100g
const sampleNutrition = {
    name: "Egg",
    calories: 143, // per 100g
    protein: 12.6, // g
    fat: 9.5, // g
    carbs: 1.1, // g
    source: "USDA",
};

export default function NutritionFacts() {
    const [servingGrams, setServingGrams] = useState(50); // default 50g (~1 large egg)

    // Helper to scale nutrition based on serving
    const scale = (value) => ((value * servingGrams) / 100).toFixed(2);

    return (
        <div style={{ padding: 16, background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", maxWidth: 400 }}>
            <h3 style={{ marginTop: 0 }}>{sampleNutrition.name} Nutrition Facts</h3>

            <div style={{ marginBottom: 12 }}>
                <label htmlFor="serving" style={{ marginRight: 8 }}>Serving (g):</label>
                <input
                    id="serving"
                    type="number"
                    value={servingGrams}
                    onChange={(e) => setServingGrams(Number(e.target.value))}
                    style={{ width: 80, padding: 4, borderRadius: 6, border: "1px solid #e5e7eb" }}
                />
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>Calories: {scale(sampleNutrition.calories)}</li>
                <li>Protein: {scale(sampleNutrition.protein)} g</li>
                <li>Fat: {scale(sampleNutrition.fat)} g</li>
                <li>Carbs: {scale(sampleNutrition.carbs)} g</li>
            </ul>

            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>Source: {sampleNutrition.source}</div>
        </div>
    );
}

