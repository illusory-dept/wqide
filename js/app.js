console.debug("[wqide] app.js loaded");
// set header height var and highlight active nav
function syncHeaderHeight() {
  const header = document.querySelector(".topbar");
  if (!header) return;
  const h = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--header-h", `${h}px`);
}
window.addEventListener("load", syncHeaderHeight);
window.addEventListener("resize", syncHeaderHeight);

// Persist last location per top-level nav (featured/playground/more)

(function persistNav() {
  const file = location.pathname.split("/").pop() || "index.html";
  const withQuery = file + (location.search || "") + (location.hash || "");
  const area =
    file === "playground.html"
      ? "playground"
      : file === "repl.html"
        ? "repl"
        : file === "more.html"
          ? "more"
          : "featured";
  try {
    // Store filename with query/hash so article slugs are preserved
    localStorage.setItem("nav:last:" + area, withQuery);
  } catch (e) {}

  const last = {
    featured: localStorage.getItem("nav:last:featured") || "index.html",
    playground:
      localStorage.getItem("nav:last:playground") || "playground.html",
    repl: localStorage.getItem("nav:last:repl") || "repl.html",
    more: localStorage.getItem("nav:last:more") || "more.html",
  };

  // Set aria-current and rewrite tab hrefs to last visited locations
  document.querySelectorAll(".tabs a").forEach((a) => {
    const nav = a.dataset.nav;
    if (nav === area) {
      a.setAttribute("aria-current", "page");
    } else {
      if (last[nav]) a.setAttribute("href", last[nav]);
    }
  });

  // Prevent redundant reload when clicking the current tab link
  document.querySelectorAll(".tabs a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === withQuery) {
      a.addEventListener("click", (e) => e.preventDefault());
    }
  });

  // Edge navigation
  const order = ["featured", "playground", "repl", "more"];
  const idx = order.indexOf(area);
  const prevNav = order[(idx - 1 + order.length) % order.length];
  const nextNav = order[(idx + 1) % order.length];
  const left = document.querySelector(".edge.left");
  const right = document.querySelector(".edge.right");
  if (left) left.onclick = () => (location.href = last[prevNav]);
  if (right) right.onclick = () => (location.href = last[nextNav]);
})();
// Theme setup: persist and toggle between light/dark using data-theme on <html>
(function theme() {
  const key = "ui:theme";
  const root = document.documentElement;
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(key, theme);
    } catch (e) {}
  }
  const saved = (() => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  })();
  apply(saved || "light");

  // Inject a compact toggle into the pillbar (or after tabs as fallback)
  window.addEventListener("DOMContentLoaded", () => {
    const pills = document.querySelector(".topbar .pills");
    const tabs = document.querySelector(".topbar .tabs");
    if (!pills && !tabs) return;
    let btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle theme");
    function label() {
      const cur = root.getAttribute("data-theme") || "light";
      return cur === "dark" ? "dark:true" : "dark:false";
    }
    btn.textContent = label();
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      apply(next);
      btn.textContent = label();
    });
    // Prefer the pillbar; otherwise place after tabs
    if (pills) {
      pills.appendChild(btn);
    } else if (tabs) {
      tabs.parentNode.insertBefore(btn, tabs.nextSibling);
    }
  });
})();
