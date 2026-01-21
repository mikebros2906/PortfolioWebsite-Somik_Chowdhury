import { escapeHtml, formatRange } from "./db.js";

export function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? "";
}

export function setHtml(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html ?? "";
}

export function renderHero(profile) {
  setText("name", profile.fullName);
  setText("headline", profile.headline);
  setText("location", profile.location);

  const summary = (profile.summary || "").split("\n").map(line => `<p class="subtitle">${escapeHtml(line)}</p>`).join("");
  setHtml("summary", summary);

  const rawSummary = profile.summary || "";

  function splitParagraphs(text) {
    return text
      .split(/\n\s*\n/)              // split on blank lines
      .map(p => p.trim())
      .filter(Boolean);
  }

  function buildParagraphHtml(paragraphs) {
    return paragraphs
      .map(p => `<p class="subtitle">${escapeHtml(p)}</p>`)
      .join("");
  }

  function buildPreviewParagraphs(paragraphs, wordLimit) {
    let used = 0;
    const out = [];

    for (const p of paragraphs) {
      const words = p.split(/\s+/).filter(Boolean);
      if (used >= wordLimit) break;

      if (used + words.length <= wordLimit) {
        out.push(p);
        used += words.length;
      } else {
        const remaining = wordLimit - used;
        out.push(words.slice(0, remaining).join(" ") + "…");
        used = wordLimit;
        break;
      }
    }

    return out;
  }

  const paragraphs = splitParagraphs(rawSummary);
  const fullHtml = buildParagraphHtml(paragraphs);

  const WORD_LIMIT = 50; //Set word limit to total words viewable at a time and click read more to check more
  const previewParagraphs = buildPreviewParagraphs(paragraphs, WORD_LIMIT);
  const previewHtml = buildParagraphHtml(previewParagraphs);

  // If not actually longer than the limit, just show full (no button).
  const fullWordCount = rawSummary.trim().split(/\s+/).filter(Boolean).length;
  if (fullWordCount <= WORD_LIMIT) {
    setHtml("summary", fullHtml);
  } else {
    setHtml(
      "summary",
      `
      <div class="summary">
        <div id="summaryShort">${previewHtml}</div>
        <div id="summaryFull" hidden>${fullHtml}</div>
        <button class="btn summary-toggle" id="summaryToggle" type="button" aria-expanded="false">
          Read more
        </button>
      </div>
      `
    );

    const btn = document.getElementById("summaryToggle");
    const shortEl = document.getElementById("summaryShort");
    const fullEl = document.getElementById("summaryFull");

    btn?.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));

      if (expanded) {
        fullEl.hidden = true;
        shortEl.hidden = false;
        btn.textContent = "Read more";
      } else {
        fullEl.hidden = false;
        shortEl.hidden = true;
        btn.textContent = "Show less";
      }
    });
  }

  const c = profile.contacts || {};
  const meta = [
    c.address ? `<span class="pill"><strong>Base:</strong> ${escapeHtml(c.address)}</span>` : "",
    c.email ? `<a class="pill" href="mailto:${escapeHtml(c.email)}"><strong>Email:</strong> ${escapeHtml(c.email)}</a>` : "",
    c.phone ? `<a class="pill" href="tel:${escapeHtml(c.phone)}"><strong>Phone:</strong> ${escapeHtml(c.phone)}</a>` : "",
  ].filter(Boolean).join("");
  setHtml("heroMeta", meta);

  if (c.linkedin) {
    const el = document.getElementById("btnLinkedIn");
    if (el) el.href = c.linkedin;
  }
  if (c.github) {
    const el = document.getElementById("btnGitHub");
    if (el) el.href = c.github;
  }
  if (c.leetcode) {
  const el = document.getElementById("btnLeetCode");
  if (el) el.href = c.leetcode;
  }
}

export function renderListCards(containerId, items, mapFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(mapFn).join("");
}

export function card({
  title,
  meta,
  highlights = [],
  tags = [],
  links = []
}) {
  const safeTitle = escapeHtml(title);
  const safeMeta = meta ? `<div class="meta">${escapeHtml(meta)}</div>` : "";
  const list = highlights?.length
    ? `<ul>${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}</ul>`
    : "";
  const tagsHtml = tags?.length
    ? `<div class="tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";
  const linksHtml = links?.length
    ? `<div class="tags">${links.map(l => `<a class="tag" href="${escapeHtml(l.url)}" target="_blank" rel="noreferrer">${escapeHtml(l.label)}</a>`).join("")}</div>`
    : "";

  return `
    <article class="card">
      <h3>${safeTitle}</h3>
      ${safeMeta}
      ${list}
      ${linksHtml}
      ${tagsHtml}
    </article>
  `;
}

export function experienceCard(x) {
  return card({
    title: `${x.title} — ${x.company}`,
    meta: `${formatRange(x.start, x.end)} • ${x.location ?? ""}`.trim(),
    highlights: x.highlights ?? [],
    tags: x.tags ?? []
  });
}

export function educationCard(x) {
  return card({
    title: x.qualification,
    meta: `${x.institution} • ${formatRange(x.start, x.end)}`,
    highlights: x.location ? [x.location] : [],
    tags: []
  });
}

export function projectCard(p) {
  const title = p?.title || "Untitled project";
  const org = p?.associatedWith || "";
  const start = p?.start || "";
  const end = p?.end || "";
  const highlights = Array.isArray(p?.highlights) ? p.highlights : [];
  const skills = Array.isArray(p?.skills) ? p.skills : [];

  // ✅ GitHub links only (hide if none)
const githubLinks = (Array.isArray(p?.links) ? p.links : [])
  .filter(l => l && l.url && String(l.url).trim())
  .filter(l => /github/i.test(l.label || "") || /github\.com/i.test(l.url || ""));

const repoHtml = githubLinks.length
  ? `
    <div class="project-links">
      ${githubLinks.map(l => {
        const raw = (l.label || "").trim();
        const text = /github/i.test(raw) ? "View Github Repository" : (raw || "View Repo");
        return `
          <a class="btn btn--sm github-btn" href="${escapeHtml(l.url)}" target="_blank" rel="noreferrer">
            ${escapeHtml(text)}
          </a>
        `;
      }).join("")}
    </div>
  `
  : "";

  return `
    <article class="card">
      <h3>${escapeHtml(title)}</h3>
      ${org ? `<div class="meta">${escapeHtml(org)}</div>` : ""}
      ${(start || end) ? `<div class="meta">${escapeHtml(start)}${start && end ? " – " : ""}${escapeHtml(end)}</div>` : ""}

      ${highlights.length ? `<ul>${highlights.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}

      ${repoHtml}  
      
      ${skills.length ? `<div class="tags">${skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>` : ""}    
    </article>
  `;
}

export function volunteeringCard(v) {
  return card({
    title: `${v.role} — ${v.organization}`,
    meta: `${formatRange(v.start, v.end)}${v.cause ? " • " + v.cause : ""}`,
    highlights: v.highlights ?? [],
    tags: []
  });
}
