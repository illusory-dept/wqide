// Hand-rolled editor with line numbers and a toolbar

import init, { run_wasm } from "./wq/wq.js";
await init(new URL("./wq/wq_bg.wasm", import.meta.url));

const ta = document.querySelector("textarea.editor-text");
const gutter = document.querySelector(".gutter");
const output = document.querySelector(".run-output");
const stdinInput = document.querySelector("#stdin");
const clearOutBtn = document.querySelector("#clearOutBtn");
const runBtn = document.querySelector("#runBtn");
const editor = document.querySelector(".editor");

function refreshLines() {
  const lines = ta.value.split("\n").length || 1;
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= lines; i++) {
    const div = document.createElement("div");
    div.className = "ln";
    div.textContent = i;
    frag.appendChild(div);
  }
  gutter.innerHTML = "";
  gutter.appendChild(frag);
}
function syncScroll() {
  gutter.scrollTop = ta.scrollTop;
}
ta.addEventListener("input", refreshLines);
ta.addEventListener("scroll", syncScroll);
document.addEventListener("DOMContentLoaded", refreshLines);
window.addEventListener("load", refreshLines);
// Also attempt an immediate draw in case module loads after DOM is ready
if (ta && gutter) {
  refreshLines();
}

runBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  runBtn.disabled = true;
  // Stream prints to the output element as they arrive
  output.textContent = "";
  // ensure output is scrolled to bottom when content arrives; :empty CSS will hide when blank
  try {
    const code = ta.value;
    // Interpret literal "\n" sequences as real newlines before splitting
    const stdinArr = stdinInput.value
      ? stdinInput.value.replace(/\\n/g, "\n").split(/\r?\n/)
      : [];
    console.log("clicked run with code =", code, "stdin =", stdinArr);
    const out = await run_wasm(code, {
      stdin: stdinArr,
      stdout: (chunk) => {
        output.textContent += chunk;
        output.scrollTop = output.scrollHeight;
        if (editor) editor.classList.add("has-output");
      },
    });
    // const result = typeof out === "string" ? out : JSON.stringify(out, null, 2);
    // const needsNL = output.textContent && !output.textContent.endsWith("\n");
    // output.textContent += (needsNL ? "\n" : "") + "= " + result;
    if (editor) editor.classList.add("has-output");
  } catch (err) {
    console.error(err);
    output.textContent = (err?.message ?? String(err)) + "\n";
  } finally {
    runBtn.disabled = false;
  }
});

// Clear output and hide (via :empty CSS)
if (clearOutBtn) {
  clearOutBtn.addEventListener("click", () => {
    output.textContent = "";
    if (editor) editor.classList.remove("has-output");
  });
}

// Preload code/stdin from query parameters if provided
(function preloadFromQuery() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const sin = params.get("stdin");
  if (code) {
    ta.value = decodeURIComponent(code);
    refreshLines();
  }
  if (sin) {
    stdinInput.value = decodeURIComponent(sin);
  }
})();
