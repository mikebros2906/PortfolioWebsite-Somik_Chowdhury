import { loadDb, escapeHtml } from "./db.js";
import {
  renderHero,
  renderListCards,
  experienceCard,
  educationCard,
  projectCard,
  volunteeringCard,
  certificationCard,   // ✅ add
  setText,
  setHtml
} from "./render.js";

function setActiveNav() {
  const page = document.body.dataset.page || "home";
  document.querySelectorAll(".nav-links a").forEach(a => {
    const target = a.dataset.nav;
    if (!target) return;
    a.classList.toggle("active", target === page);
  });
}

function normalize(str){ return String(str || "").toLowerCase().trim(); }

function uniq(arr) {
  return [...new Set((arr || []).map(s => String(s).trim()).filter(Boolean))];
}

/**
 * Supports NEW schema:
 * skills.categories = [{ id, label, items: [] }]
 *
 * Also supports OLD schema (fallback):
 * skills.topSkills + skills.additionalSkills
 */
function getSkillCategories(skills) {
  if (skills?.categories?.length) return skills.categories;

  // fallback to your older structure if needed
  const all = uniq([...(skills?.topSkills || []), ...(skills?.additionalSkills || [])]);
  return [{ id: "all", label: "All skills", items: all }];
}

function renderSkillsFilter(skills) {
  const categories = getSkillCategories(skills);

  const select = document.getElementById("skillsCategory");
  const badges = document.getElementById("skillsBadges");
  const countEl = document.getElementById("skillsCount");

  if (!select || !badges) return;

  // Build dropdown
  const options = [
    { id: "all", label: "All" },
    ...categories.map(c => ({ id: c.id, label: c.label }))
  ];

  select.innerHTML = options
    .map(o => `<option value="${o.id}">${o.label}</option>`)
    .join("");

  function flattenAll() {
    const allItems = categories.flatMap(c => c.items || []);
    return uniq(allItems);
  }

  function getCategoryItems(categoryId) {
    if (categoryId === "all") return flattenAll();
    const found = categories.find(c => c.id === categoryId);
    return uniq(found?.items || []);
  }

  function draw() {
    const categoryId = select.value || "all";
    const items = getCategoryItems(categoryId);

    if (countEl) countEl.textContent = String(items.length);

    badges.innerHTML = items
      .map(s => `<span class="tag">${s}</span>`)
      .join("");
  }

    // ✅ Default to "recently_used" if it exists in your JSON
  const defaultCategory =
    categories.some(c => c.id === "recently_used") ? "recently_used" : "all";

  select.value = defaultCategory;

  select.addEventListener("change", draw);
  draw();
}

async function renderHome(db) {
  renderHero(db.profile);

  // Skills filter on home page
  renderSkillsFilter(db.skills);

  // ✅ Show only latest 4 project TITLES as cards
  const latest4 = [...(db.projects || [])]
    .sort((a, b) => (b.start || "").localeCompare(a.start || ""))
    .slice(0, 4);


  // ⚠️ you said your container id is "container"
  const container = document.getElementById("homeProjects");
  if (container) {
    const grid = container; // ✅ alias so the code using "grid" works
    const projectDetailsHtml = (p) => {
      const org = p?.associatedWith || "";
      const start = p?.start || "";
      const end = p?.end || "";
      const highlights = Array.isArray(p?.highlights) ? p.highlights : [];
      const skills = Array.isArray(p?.skills) ? p.skills : [];

      // GitHub links only
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

      const dateHtml = (start || end)
        ? `<div class="meta">${escapeHtml(start)}${start && end ? " – " : ""}${escapeHtml(end)}</div>`
        : "";

      const highlightsHtml = highlights.length
        ? `<ul>${highlights.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
        : "";

      const skillsHtml = skills.length
        ? `<div class="tags">${skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>`
        : "";

      return `
        ${org ? `<div class="meta">${escapeHtml(org)}</div>` : ""}
        ${dateHtml}
        ${highlightsHtml}
        ${repoHtml}
        ${skillsHtml}
      `;
    };

    container.innerHTML = latest4.map((p, i) => {
      const id = `homeProjDetails-${i}`;
      return `
        <article class="card home-project">
          <button class="home-project__toggle" type="button"
            aria-expanded="false"
            aria-controls="${id}">
            <h3>${escapeHtml(p?.title || "Untitled project")}</h3>
            <span class="home-project__chev" aria-hidden="true">▾</span>
          </button>

          <div id="${id}" class="home-project__details" hidden>
            ${projectDetailsHtml(p)}
          </div>
        </article>
      `;
    }).join("");

   
// Accordion behavior (open one at a time)
const closeAll = () => {
  grid.querySelectorAll(".home-project").forEach(card => card.classList.remove("is-open"));

  grid.querySelectorAll(".home-project__toggle").forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
    const panelId = btn.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.hidden = true;
  });
};

grid.querySelectorAll(".home-project__toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";

    // if clicking the already-open one -> close it
    if (expanded) {
      closeAll();
      return;
    }

    closeAll();

    // open the clicked one
    btn.setAttribute("aria-expanded", "true");
    const panelId = btn.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.hidden = false;

    // make this card span full width
    const card = btn.closest(".home-project");
    if (card) card.classList.add("is-open");
  });
});

  }



  // Quick contact
  const c = db.profile?.contacts || {};
const emailEl = document.getElementById("contactEmail");
if (emailEl && c.email) {
  const email = String(c.email).trim();
  emailEl.textContent = email;
  emailEl.href = `mailto:${encodeURIComponent(email)}`;
}

  setText("contactPhone", c.phone || "");
}

async function renderProjects(db) {
  const all = db.projects || [];
  const skillSet = new Set();
  all.forEach(p => (p.skills || []).forEach(s => skillSet.add(s)));
  const skills = ["All skills", ...Array.from(skillSet).sort((a,b)=>a.localeCompare(b))];

  const select = document.getElementById("skillFilter");
  if (select) {
    select.innerHTML = skills.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  const input = document.getElementById("searchInput");
  const gridId = "projectsGrid";

  function draw() {
    const q = normalize(input?.value);
    const selected = select?.value || "All skills";

    const filtered = all.filter(p => {
      const hay = normalize([p.title, p.associatedWith, ...(p.highlights || [])].join(" "));
      const matchesText = !q || hay.includes(q);
      const matchesSkill = selected === "All skills" || (p.skills || []).includes(selected);
      return matchesText && matchesSkill;
    });

    setText("projectsCount", `${filtered.length}`);
    renderListCards(gridId, filtered, projectCard);
  }

  input?.addEventListener("input", draw);
  select?.addEventListener("change", draw);
  draw();
}

function renderCertifications(db) {
  const certsRaw = Array.isArray(db.certifications) ? db.certifications : [];
  const certs = [...certsRaw];

  const gridId = "certificationsGrid";
  const searchEl = document.getElementById("certSearch");
  const skillEl = document.getElementById("certSkill");

  // Sort newest first if "issued" exists like "Jun 2025"
  const monthMap = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const issuedKey = (s) => {
    const parts = String(s || "").trim().split(/\s+/);
    if (parts.length < 2) return 0;
    const m = monthMap[(parts[0] || "").slice(0,3).toLowerCase()] || 0;
    const y = parseInt(parts[1], 10) || 0;
    return y * 100 + m;
  };
  certs.sort((a,b) => issuedKey(b.issued) - issuedKey(a.issued));

  // Build unique skill list
  const skills = uniq(
    certs.flatMap(c => (Array.isArray(c.skills) ? c.skills : []))
  ).sort((a,b) => a.localeCompare(b));

  // Fill dropdown safely (no innerHTML injection)
  if (skillEl) {
    skillEl.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All skills";
    skillEl.appendChild(allOpt);

    for (const s of skills) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      skillEl.appendChild(opt);
    }
  }

  const apply = () => {
    const q = normalize(searchEl?.value);
    const chosenSkill = skillEl?.value || "";

    const filtered = certs.filter(c => {
      const hay = normalize([
        c.title, c.issuer, c.issued, c.credentialId,
        ...(Array.isArray(c.skills) ? c.skills : [])
      ].join(" "));

      const matchesText = !q || hay.includes(q);
      const matchesSkill = !chosenSkill || (Array.isArray(c.skills) && c.skills.includes(chosenSkill));
      return matchesText && matchesSkill;
    });

    setText("certificationsCount", String(filtered.length));
    renderListCards(gridId, filtered, certificationCard);
  };

  searchEl?.addEventListener("input", apply);
  skillEl?.addEventListener("change", apply);

  apply();
}



async function renderExperience(db) {
  const items = db.experience || [];
  renderListCards("experienceGrid", items, experienceCard);
}

async function renderEducation(db) {
  const items = db.education || [];
  renderListCards("educationGrid", items, educationCard);
}

async function renderVolunteering(db) {
  const items = db.volunteering || [];
  renderListCards("volunteeringGrid", items, volunteeringCard);
}

async function renderContact(db) {
  const c = db.profile?.contacts || {};
  const cards = [
    c.email ? { title: "Email", meta: c.email, href: `mailto:${c.email}` } : null,
    c.phone ? { title: "Phone", meta: c.phone, href: `tel:${c.phone}` } : null,
    c.linkedin ? { title: "LinkedIn", meta: c.linkedin, href: c.linkedin } : null,
    c.github ? { title: "GitHub", meta: c.github, href: c.github } : null,
    c.address ? { title: "Address", meta: c.address, href: "" } : null,
  ].filter(Boolean);

  const html = cards.map(x => `
    <article class="card">
      <h3>${x.title}</h3>
      <div class="meta">${x.meta}</div>
      ${x.href ? `<div class="tags"><a class="tag" href="${x.href}" target="_blank" rel="noreferrer">Open</a></div>` : ""}
    </article>
  `).join("");

    const photoSrc = db.profile?.photo || "./assets/images/profile.jpg";

  const photoCard = `
    <article class="card contact-photo-card">
      <h3>Photo</h3>
      <img class="contact-photo" src="${photoSrc}" alt="Profile photo" />
      <div class="meta">Hello, This is me ! 😊</div>
    </article>
  `;

  setHtml("contactGrid", photoCard + html);

    // ✅ Lightbox: click photo to enlarge
  const photo = document.querySelector(".contact-photo");
  const modal = document.getElementById("photoModal");
  const modalImg = document.getElementById("photoModalImg");
  const closeBtn = document.getElementById("photoModalClose");

  function openPhotoModal() {
    if (!photo || !modal || !modalImg) return;
    modalImg.src = photo.src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePhotoModal() {
    if (!modal || !modalImg) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    document.body.style.overflow = "";
  }

  photo?.addEventListener("click", openPhotoModal);
  closeBtn?.addEventListener("click", closePhotoModal);

  // Close when clicking backdrop
  modal?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closePhotoModal();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePhotoModal();
  });

}

function initMobileNav(){
  const btn = document.querySelector(".nav-toggle");
  const menu = document.getElementById("navMenu");
  if (!btn || !menu) return;

  // Close when tapping the empty area of the overlay (not a link)
  menu.addEventListener("click", (e) => {
  if (e.target === menu) {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
  }
  });


  function closeMenu(){
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
  }

  function openMenu(){
    document.body.classList.add("nav-open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
  }

  btn.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("nav-open");
    isOpen ? closeMenu() : openMenu();
  });

  // Close when clicking a nav link (mobile)
  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 720) closeMenu();
    });
  });

  // Close if clicking outside nav
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (!e.target.closest(".nav")) closeMenu();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // If resized back to desktop, ensure menu isn't stuck open
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });
}


(async function main() {
  try {
    setActiveNav();
    initMobileNav();
    const db = await loadDb();
    

    const page = document.body.dataset.page || "home";
    if (page === "home") await renderHome(db);
    if (page === "projects") await renderProjects(db);
    if (page === "experience") await renderExperience(db);
    if (page === "education") await renderEducation(db);
    if (page === "certifications") renderCertifications(db);
    if (page === "volunteering") await renderVolunteering(db);
    if (page === "contact") await renderContact(db);
  } catch (err) {
    console.error(err);
    const holder = document.getElementById("appError");
    if (holder) {
      holder.textContent = err.message || String(err);
      holder.style.display = "block";
    } else {
      alert(err.message || String(err));
    }
  }
})();
