// Build outline from headings, scrollspy, and copy-to-clipboard buttons
// after article content is injected.

import init, { run_wasm } from "./wq.js";
await init(new URL("./wq_bg.wasm", import.meta.url));

window.initTutorialUI = function initTutorialUI() {
  const article = document.querySelector(".article");
  const outlineList = document.querySelector("#outlineList");
  const mobileOutline = document.querySelector("#mobileOutline");

  if (article && outlineList) {
    // Reset any existing outline
    outlineList.innerHTML = "";
    if (mobileOutline) mobileOutline.innerHTML = "";

    const headings = Array.from(article.querySelectorAll("h2, h3"));
    headings.forEach((h, idx) => {
      if (!h.id) h.id = "sec-" + (idx + 1);
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      if (h.tagName === "H3") a.classList.add("sub");
      outlineList.appendChild(a);
      if (mobileOutline) {
        const ma = a.cloneNode(true);
        mobileOutline.appendChild(ma);
      }
    });

    const links = Array.from(outlineList.querySelectorAll("a"));
    const mlinks = mobileOutline
      ? Array.from(mobileOutline.querySelectorAll("a"))
      : [];

    function activate(id) {
      links.forEach((l) =>
        l.classList.toggle("active", l.getAttribute("href") === "#" + id),
      );
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          activate(visible[0].target.id);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    headings.forEach((h) => observer.observe(h));

    // smooth scroll
    function hookup(list) {
      list.forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const id = a.getAttribute("href").slice(1);
          const target = document.getElementById(id);
          if (target) {
            const top =
              target.getBoundingClientRect().top +
              window.scrollY -
              (parseInt(
                getComputedStyle(document.documentElement).getPropertyValue(
                  "--header-h",
                ),
              ) +
                16);
            window.scrollTo({ top, behavior: "smooth" });
            activate(id);
          }
        });
      });
    }
    hookup(links);
    hookup(mlinks);
  }

  // Enhance code blocks: wrap pre in .code-wrapper with header and copy button
  document.querySelectorAll(".article pre").forEach((pre) => {
    if (
      pre.parentElement &&
      pre.parentElement.classList.contains("code-wrapper")
    )
      return;
    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";
    const header = document.createElement("div");
    header.className = "code-header";

    // Detect language from code class e.g. language-js
    const codeEl = pre.querySelector("code");
    let lang = "";
    if (codeEl) {
      const m = Array.from(codeEl.classList).find((c) =>
        c.startsWith("language-"),
      );
      if (m) lang = m.replace("language-", "").trim();
    }

    // Left: language label (only if provided)
    if (lang) {
      const langSpan = document.createElement("span");
      langSpan.className = "lang";
      langSpan.textContent = lang.toUpperCase();
      header.appendChild(langSpan);
    } else {
      // add an empty spacer to keep layout consistent
      const spacer = document.createElement("span");
      spacer.className = "lang";
      spacer.textContent = "";
      header.appendChild(spacer);
    }

    // Right: actions (Run for wq + Copy)
    const actions = document.createElement("div");
    actions.className = "code-actions";

    if (lang === "wq") {
      const run = document.createElement("button");
      run.type = "button";
      run.className = "copy-btn";
      run.textContent = "Run";
      run.addEventListener("click", async () => {
        const code = pre.innerText || (codeEl ? codeEl.innerText : "");
        const stdinArr = [];
        // Render result panel after this code block
        let panel = wrapper.nextElementSibling;
        if (
          !panel ||
          !panel.classList ||
          !panel.classList.contains("run-result")
        ) {
          panel = document.createElement("div");
          panel.className = "run-result";
          const head = document.createElement("div");
          head.className = "run-head";
          head.textContent = "Result";
          const preOut = document.createElement("pre");
          const codeOut = document.createElement("code");
          preOut.appendChild(codeOut);
          panel.appendChild(head);
          panel.appendChild(preOut);
          wrapper.parentNode.insertBefore(panel, wrapper.nextSibling);
          // visually attach by marking wrapper as attached
          wrapper.classList.add("attached");
        }
        const codeOut = panel.querySelector("code");

        run.disabled = true;
        // stream printed output; clear previous
        codeOut.textContent = "";
        try {
          console.log("clicked run with code =", code, "stdin =", stdinArr);
          const out = await run_wasm(code, {
            stdin: stdinArr,
            stdout: (chunk) => {
              codeOut.textContent += chunk;
            },
          });
          const result =
            typeof out === "string" ? out : JSON.stringify(out, null, 2);
          const needsNL =
            codeOut.textContent && !codeOut.textContent.endsWith("\n");
          codeOut.textContent += (needsNL ? "\n" : "") + "\u{258D} " + result;
        } catch (err) {
          console.error(err);
          codeOut.textContent = (err?.message ?? String(err)) + "\n";
        } finally {
          run.disabled = false;
        }
      });
      actions.appendChild(run);
    }

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    actions.appendChild(btn);
    header.appendChild(actions);

    // move pre inside wrapper
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        btn.textContent = "✓ Copied";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1400);
      } catch (e) {
        btn.textContent = "Error";
      }
    });
  });
};
