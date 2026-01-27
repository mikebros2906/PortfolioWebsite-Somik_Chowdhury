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

function typeText(el, text, { speed = 5, delay = 50 } = {}) {
  // cancel previous run
  if (el._typeTimer) clearTimeout(el._typeTimer);

  // reset state
  el.textContent = "";
  el.classList.remove("cursor-on");

  // respect reduced motion
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    el.textContent = text;
    el.classList.add("cursor-on"); // show caret even without typing
    return;
  }

  let i = 0;
  const schedule = (fn, ms) => (el._typeTimer = setTimeout(fn, ms));

  schedule(() => {
    const tick = () => {
      el.textContent = text.slice(0, i++);
      if (i <= text.length) {
        schedule(tick, speed);
      } else {
        el.classList.add("cursor-on"); // ✅ caret appears after typing ends
      }
    };
    tick();
  }, delay);
}




export function renderHero(profile) {

  

const nameEl = document.getElementById("name");
const fullName = profile.fullName || "";

// type only on first load (per tab session) and only on home page
const isHome = document.body?.dataset?.page === "home";
const alreadyTyped = sessionStorage.getItem("typedName") === "1";

if (nameEl) {
  // If renderHero gets called again, cancel the previous typing cleanly
  if (nameEl._typeTimer) clearTimeout(nameEl._typeTimer);
  nameEl.textContent = "";

  if (isHome) {
    typeText(nameEl, fullName, { speed: 55, delay: 150 });
  } else {
    nameEl.textContent = fullName;
  }
}

  setText("headline", profile.headline);
  setText("location", profile.location);

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
    <div class="summary-box" id="summaryBox" aria-live="polite">
      <div class="summary-inner" id="summaryInner">
        ${previewHtml}
      </div>
    </div>

    <button class="btn summary-toggle" id="summaryToggle" type="button" aria-expanded="false">
      Read more
    </button>
  </div>
  `
);

    const btn = document.getElementById("summaryToggle");
const box = document.getElementById("summaryBox");
const inner = document.getElementById("summaryInner");

if (btn && box && inner) {
  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  let expanded = false;

  const animateHeight = (from, to) => {
    if (prefersReduced) {
      box.style.height = "auto";
      return;
    }

    box.style.height = `${from}px`;
    box.style.transition = "height 260ms ease, opacity 180ms ease";
    box.style.opacity = "0.98";

    // force reflow so transition applies
    box.getBoundingClientRect();

    requestAnimationFrame(() => {
      box.style.height = `${to}px`;
      box.style.opacity = "1";
    });

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      box.style.transition = "";
      box.style.height = "auto"; // allow responsive wrapping after animation
      box.removeEventListener("transitionend", onEnd);
    };
    box.addEventListener("transitionend", onEnd);
  };

  // Set initial measured height (so first expand animates smoothly)
  const initHeight = inner.getBoundingClientRect().height;
  box.style.height = `${initHeight}px`;

  btn.addEventListener("click", () => {
    const from = inner.getBoundingClientRect().height;

    expanded = !expanded;
    btn.setAttribute("aria-expanded", String(expanded));
    btn.textContent = expanded ? "Show less" : "Read more";

    // Swap content, then measure target height
    inner.innerHTML = expanded ? fullHtml : previewHtml;

    const to = inner.getBoundingClientRect().height;

    // Animate box height from old -> new
    animateHeight(from, to);
  });
}



  }

// ✅ Hero photo on home page + lightbox (same behavior as contact)
const photoSlot = document.getElementById("heroPhotoSlot");
const photoSrc = profile?.photo || "./assets/images/profile.jpg";

if (photoSlot) {
  photoSlot.innerHTML = `
    <article class="card hero-photo-card">
      <img class="hero-photo" id="heroPhotoImg"
           src="${escapeHtml(photoSrc)}"
           alt="Profile photo" />
    </article>
  `;

  const imgEl = document.getElementById("heroPhotoImg");
  bindPhotoLightbox(imgEl);
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

export function certificationCard(c) {
  const title = c?.title || "Untitled certification";
  const issuer = c?.issuer || "";
  const issued = c?.issued || "";
  const credentialUrl = c?.credentialUrl || "";
  const skills = Array.isArray(c?.skills) ? c.skills : [];

  // ✅ only a button (no credential id/text)
  const credentialBtn = credentialUrl
    ? `
      <div class="project-links">
        <a class="btn btn--sm github-btn" href="${escapeHtml(credentialUrl)}" target="_blank" rel="noreferrer">
          Check Certificate
        </a>
      </div>
    `
    : "";

  const skillsLine = skills.length
    ? `<div class="meta"><strong>Skills:</strong> ${escapeHtml(skills.join(" • "))}</div>`
    : "";

  return `
    <article class="card">
      <h3>${escapeHtml(title)}</h3>
      ${issuer ? `<div class="meta">${escapeHtml(issuer)}</div>` : ""}
      ${issued ? `<div class="meta">Issued ${escapeHtml(issued)}</div>` : ""}
      ${credentialBtn}
      ${skillsLine}
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

function bindPhotoLightbox(imgEl) {
  if (!imgEl || imgEl.dataset.lightboxBound === "1") return;
  imgEl.dataset.lightboxBound = "1";

  const modal = document.getElementById("photoModal");
  const modalImg = document.getElementById("photoModalImg");
  const closeBtn = document.getElementById("photoModalClose");

  if (!modal || !modalImg || !closeBtn) return;

  const open = () => {
    modalImg.src = imgEl.src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    document.body.style.overflow = "";
  };

  imgEl.style.cursor = "zoom-in";
  imgEl.addEventListener("click", open);

  closeBtn.addEventListener("click", close);

  // backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") close();
  });

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
