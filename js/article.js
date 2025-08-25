// Ensure dependencies execute first (and await tutorial.js' top-level await)
import "./markdown.js";
import "./tutorial.js";

// Load manifest, pick tutorial by slug, fetch markdown, render, and init outline/copy UI.
(async function () {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const $title = document.getElementById("articleTitle");
  const $content = document.getElementById("articleContent");
  const $crumbTitle = document.getElementById("crumb-title");
  const $crumbSection = document.getElementById("crumb-section");

  function fail(msg) {
    if ($title) $title.textContent = "Not Found";
    if ($content) $content.textContent = msg;
  }

  try {
    if (!slug) return fail("Missing tutorial slug.");
    const res = await fetch("manifest.json");
    const manifest = await res.json();
    const list = manifest.tutorials || [];
    const t = list.find((x) => x.slug === slug);
    if (!t) return fail("Unknown tutorial: " + slug);

    // Title + breadcrumbs + page title
    document.title = `wqide — ${t.title}`;
    if ($title) $title.textContent = t.title;
    if ($crumbTitle) $crumbTitle.textContent = t.title;
    if ($crumbSection) {
      const sect = t.section || "Tutorials";
      $crumbSection.textContent = sect;
      $crumbSection.setAttribute(
        "href",
        `subfolder.html?section=${encodeURIComponent(sect)}`,
      );
    }

    // Fetch markdown and render
    const mdRes = await fetch(t.file);
    const md = await mdRes.text();
    const html = window.parseMarkdown(md);
    const root = document.getElementById("articleRoot");
    if (!root) return fail("Missing article root.");

    // Replace content area with parsed HTML
    const container = document.createElement("div");
    container.innerHTML = html;

    // If first block is an h1, remove and use as title
    const h1 = container.querySelector("h1");
    if (h1 && h1 === container.firstElementChild) {
      if ($title) $title.textContent = h1.textContent;
      h1.remove();
    }

    $content.innerHTML = "";
    $content.append(...Array.from(container.childNodes));

    // Initialize outline and code block UI after injection
    if (window.initTutorialUI) window.initTutorialUI();
  } catch (e) {
    fail("Error loading tutorial.");
    // Optionally log to console for debugging
    console.error(e);
  }
})();
