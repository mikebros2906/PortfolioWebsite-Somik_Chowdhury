# Portfolio Website (HTML + CSS + JS + JSON "Database")

This is a multi-page portfolio site where **all content is rendered from a single database file**:

`database/portfolio-data.json`

You can add/remove/edit experience, education, projects, skills, etc. **without touching the HTML**.

---

## How to run locally (recommended)

Because browsers block `fetch()` when you open HTML directly from disk (`file://`), run a tiny local server:

### Option A — VS Code (easiest)
1. Install the **Live Server** extension.
2. Right-click `index.html` → **Open with Live Server**.

### Option B — Python (built-in on many machines)
In the project folder:
```bash
python -m http.server 5500
```
Then open:
`http://localhost:5500`

---

## How to edit content (the only file you need)

Open:
`database/portfolio-data.json`

### Add a project
Add an object inside the `"projects"` array. Example:
```json
{
  "title": "New Project",
  "start": "2026-01",
  "end": "2026-02",
  "associatedWith": "My University",
  "highlights": ["What you built", "What you used", "What result you got"],
  "skills": ["Python", "SQL"],
  "links": [{"label": "GitHub", "url": "https://github.com/..." }]
}
```

### Add experience / education / volunteering
Same pattern: add a new object to the relevant array.

---

## Blunt improvement notes (don’t ignore these)

- Your portfolio is only as strong as the **numbers + outcomes** you can prove.
  - “Built X” is fine, but “Built X and improved Y by Z%” is what gets interviews.
- If you can’t back up a metric (like “40%”), remove it or explain how you measured it.
- Don’t overstuff the Skills list. Recruiters scan; they don’t read. Keep the *top* skills tight.

---

## Deploying
This works on any static host (GitHub Pages, Netlify) **as long as the JSON file is served**.
If you use GitHub Pages, it will work out-of-the-box.

---
