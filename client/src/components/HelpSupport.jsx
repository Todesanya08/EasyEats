import React, { useState } from "react";

export default function HelpSupport() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending message
    setFeedback(`✅ Thank you, ${name}! Your message has been sent.`);
    setName("");
    setEmail("");
    setMessage("");
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    margin: "8px 0",
    borderRadius: 4,
    border: "1px solid #ccc",
    boxSizing: "border-box"
  };

  const btnStyle = {
    padding: 12,
    width: "100%",
    borderRadius: 4,
    border: "none",
    backgroundColor: "#4CAF50",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s"
  };

  const btnHover = (e) => e.target.style.backgroundColor = "#45a049";
  const btnLeave = (e) => e.target.style.backgroundColor = "#4CAF50";

  const cardStyle = {
    background: "#f9f9f9",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    maxWidth: 600,
    margin: "0 auto"
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginBottom: 12 }}>Help & Support</h3>
      <p>Have a question or need help? Fill out the form below and we'll get back to you as soon as possible.</p>

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <textarea
          style={{ ...inputStyle, height: 100 }}
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          style={btnStyle}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          Send Message
        </button>
      </form>

      {feedback && <p style={{ color: "#155724", marginTop: 12 }}>{feedback}</p>}
    </div>
  );
}

