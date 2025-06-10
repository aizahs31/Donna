import React from "react";

export default function Footer() {
  const footerStyle = {
    padding: "2.5rem 1rem",
    backgroundColor: "#f5f5f5", // light soft grey
    color: "#222222", // black-ish text
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    borderTop: "1px solid #e0e0e0",
  };

  const patternStyle = {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(circle at 30% 30%, rgba(200, 220, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255, 200, 220, 0.2) 0%, transparent 50%)",
    zIndex: 0,
    opacity: 0.5,
    pointerEvents: "none", // make sure background is non-interactive
  };

  const contentStyle = {
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
  };

  const taglineStyle = {
    fontSize: "1rem",
    marginBottom: "1rem",
    fontWeight: 500,
    color: "#333",
    letterSpacing: "0.03em",
  };

  const linkStyle = {
    margin: "0 1rem",
    color: "#222",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s ease",
    position: "relative",
  };

  const hoverColor = "#0077cc"; // soft blue hover

  return (
    <footer style={footerStyle}>
      <div style={patternStyle} />
      <div style={contentStyle}>
        <p style={taglineStyle}>Designed & Built by Ryze 🌸</p>
        <div>
          <a
            href="https://github.com/your-github-username"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseOver={(e) => (e.target.style.color = hoverColor)}
            onMouseOut={(e) => (e.target.style.color = "#222")}
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/your-linkedin-username"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseOver={(e) => (e.target.style.color = hoverColor)}
            onMouseOut={(e) => (e.target.style.color = "#222")}
          >
            LinkedIn
          </a>
          <a
            href="mailto:your-email@example.com"
            style={linkStyle}
            onMouseOver={(e) => (e.target.style.color = hoverColor)}
            onMouseOut={(e) => (e.target.style.color = "#222")}
          >
            your-email@example.com
          </a>
        </div>
      </div>
    </footer>
  );
}
