export const askDonna = async (prompt) => {
  const res = await fetch("http://localhost:5000/donna/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  return res.json();
};
