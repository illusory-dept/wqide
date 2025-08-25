// Build a section listing from manifest.json.
(async function () {
  const grid = document.getElementById("sectionGrid");
  if (!grid) return;
  const titleEl = document.querySelector(".folder-head h1");
  const crumbEl = document.querySelector(".breadcrumbs span:last-child");
  const params = new URLSearchParams(location.search);
  const sectionParam = params.get("section");
  const sectionName =
    (sectionParam && sectionParam.trim()) ||
    (titleEl && titleEl.textContent.trim()) ||
    "Basics";

  // Reflect chosen section in heading and breadcrumb
  if (titleEl) titleEl.textContent = sectionName;
  if (crumbEl) crumbEl.textContent = sectionName;

  try {
    const res = await fetch("manifest.json");
    const manifest = await res.json();
    const list = (manifest.tutorials || []).filter(
      (t) => (t.section || "").toLowerCase() === sectionName.toLowerCase(),
    );

    // Clear and rebuild
    grid.innerHTML = "";
    list.forEach((t) => {
      const card = document.createElement("section");
      card.className = "card";
      card.style.margin = "0";

      const h2 = document.createElement("h2");
      h2.textContent = t.title;
      const p = document.createElement("p");
      p.textContent = t.description || "";
      const code = document.createElement("span");
      code.className = "code";
      code.textContent = t.code || "";
      const a = document.createElement("a");
      a.className = "stretched";
      a.href = `article.html?slug=${encodeURIComponent(t.slug)}`;
      a.setAttribute("aria-label", `${t.title} lesson`);

      card.appendChild(h2);
      card.appendChild(p);
      if (t.code) card.appendChild(code);
      card.appendChild(a);
      grid.appendChild(card);
    });

    if (!list.length) {
      const empty = document.createElement("p");
      empty.textContent = "No tutorials found for this section.";
      empty.style.color = "#355e78";
      grid.parentElement.appendChild(empty);
    }
  } catch (e) {
    console.error("Error loading manifest:", e);
    const err = document.createElement("p");
    err.textContent = "Failed to load tutorials.";
    err.style.color = "#b91c1c";
    grid.parentElement.appendChild(err);
  }
})();
