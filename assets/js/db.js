// assets/js/db.js

export async function loadDb() {
  // Cache once per tab
  if (window.__PORTFOLIO_DB__) return window.__PORTFOLIO_DB__;

  // IMPORTANT: resolve relative to this module, not the page URL
  // This survives GitHub Pages subpaths and any <base href="..."> issues.
  const url = new URL("../../database/portfolio-data.json", import.meta.url);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not load portfolio-data.json (HTTP ${res.status}).`);
  }

  const data = await res.json();
  window.__PORTFOLIO_DB__ = data;
  return data;
}

export function formatMonth(isoYYYYMM) {
  if (!isoYYYYMM) return "";
  const [y, m] = String(isoYYYYMM).split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!y || !m) return String(isoYYYYMM);
  return `${months[m - 1]} ${y}`;
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
    .replaceAll("'", "&#39;");
}
