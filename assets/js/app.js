import { loadDb } from "./db.js";
import {
  renderHero,
  renderListCards,
  experienceCard,
  educationCard,
  projectCard,
  volunteeringCard,
  setHtml,
  setText
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

  const container = document.getElementById("homeProjects");
  if (container) {
    container.innerHTML = latest4
      .map(p => `
        <article class="card">
          <h3><a href="./projects.html">${p.title}</a></h3>
        </article>
      `)
      .join("");
  }


  // Quick contact
  const c = db.profile?.contacts || {};
  setText("contactEmail", c.email || "");
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
