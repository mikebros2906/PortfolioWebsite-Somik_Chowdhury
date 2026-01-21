export async function loadDb() {
  // Loads the JSON "database" once, then caches it.
  if (window.__PORTFOLIO_DB__) return window.__PORTFOLIO_DB__;

  const res = await fetch("./database/portfolio-data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Could not load database/portfolio-data.json. Are you running this via a local server (Live Server / http.server)?");
  }
  const data = await res.json();
  window.__PORTFOLIO_DB__ = data;
  return data;
}

export function formatMonth(isoYYYYMM) {
  if (!isoYYYYMM) return "";
  const [y, m] = isoYYYYMM.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!y || !m) return isoYYYYMM;
  return `${months[m-1]} ${y}`;
}

export function formatRange(start, end) {
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : "Present";
  return `${s} — ${e}`;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
