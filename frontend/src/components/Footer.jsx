import React from "react";

export default function Footer({ theme, toggleTheme, ThemeToggle }) {
  const footerStyle = {
    padding: "2.5rem 1rem",
    backgroundColor: "var(--color-bg-panel)",
    color: "var(--color-text-main)",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    borderTop: "2px solid var(--color-border)",
  };

  const patternStyle = {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(circle at 20% 30%, var(--color-accent-strong) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--color-accent-muted) 0%, transparent 40%)",
    zIndex: 0,
    opacity: 0.3,
    pointerEvents: "none",
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
    color: "var(--color-text-muted)",
    letterSpacing: "0.03em",
  };

  const linkStyle = {
    margin: "0 1rem",
    color: "var(--color-accent-dark)",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s ease",
    position: "relative",
  };

  const handleHover = (e, isHovering) => {
    e.target.style.color = isHovering
      ? "var(--color-accent-strong)"
      : "var(--color-accent-dark)";
  };

  return (
    <footer style={footerStyle}>
      <div style={patternStyle} />
      <div style={contentStyle}>
        <p style={taglineStyle}>Designed & Built by Ryze 🌸</p>
        <div>
          {["GitHub", "LinkedIn", "shaziafarheen10@gmail.com"].map((text, i) => {
            const hrefs = [
              "https://github.com/aizahs31",
              "https://www.linkedin.com/in/shazia-mohommed",
              "mailto:shaziafarheen10@gmail.com",
            ];
            return (
              <a
                key={i}
                href={hrefs[i]}
                target={hrefs[i]}
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseOver={(e) => handleHover(e, true)}
                onMouseOut={(e) => handleHover(e, false)}
              >
                {text}
              </a>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            marginTop: "1.5rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span style={{ fontSize: "1rem" }}>Try night theme</span>
          {ThemeToggle && <ThemeToggle theme={theme} onToggle={toggleTheme} />}
        </div>
      </div>
    </footer>
  );
}
