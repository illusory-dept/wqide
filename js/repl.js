import init, { WqSession, get_help_doc, get_wq_ver } from "./wq/wq.js";
await init(new URL("./wq/wq_bg.wasm", import.meta.url));

const codeEl = document.getElementById("code");
const term = document.getElementById("term");
const evalBtn = document.getElementById("evalBtn");
const clearBtn = document.getElementById("clearBtn");
const resetBtn = document.getElementById("resetBtn");
const stdinLine = document.getElementById("stdinLine");
const pushStdinBtn = document.getElementById("pushStdinBtn");

let execCounter = 1;
const wq_version = get_wq_ver();

function append(chunk) {
  term.textContent += chunk;
  term.scrollTop = term.scrollHeight;
}

function promptPrefix() {
  return "wq[" + execCounter + "] ";
}

let session = null;
let history = [];
let histIndex = -1; // -1 means not in history view
let pendingBuffer = "";
let timeMode = false;

function ensureSession() {
  if (!session) {
    if (typeof WqSession !== "function") {
      append("WqSession not available.\n");
      throw new Error("WqSession not available");
    }
    session = new WqSession();
    session.set_stdout((chunk) => append(chunk));
    session.set_stderr((chunk) => append(chunk));
  }
  return session;
}

function resetSession() {
  session = null;
  ensureSession();
  append(`wq ${wq_version} (c) tttiw (l) mit | help\n`);
}

resetBtn.addEventListener("click", () => {
  resetSession();
});

pushStdinBtn.addEventListener("click", () => {
  const text = stdinLine.value;
  if (!text) return;
  // Interpret literal "\n" sequences as real newlines before splitting
  const normalized = text.replace(/\\n/g, "\n");
  const lines = normalized.includes("\n")
    ? normalized.split(/\r?\n/)
    : [normalized];
  try {
    ensureSession().push_stdin(lines);
    append(`(pushed ${lines.length} line(s) to stdin)\n`);
    stdinLine.value = "";
  } catch (e) {
    console.error(e);
    append((e?.message ?? String(e)) + "\n");
  }
});

async function doEval() {
  const code = codeEl.value;
  if (!code.trim()) return;
  // const indented = code
  // .trim()
  // .split("\n")
  // .map((line) => "  " + line) // prepend 2 spaces
  // .join("\n");
  append(promptPrefix() + code.trim() + "\n");
  execCounter++;
  evalBtn.disabled = true;
  try {
    // Intercept REPL commands
    const trimmed = code.trim();

    let handled = false;
    if (trimmed === "vars" || trimmed === "\\v") {
      const handledResult = await ensureSession().get_env();
      append(handledResult + "\n");
      handled = true;
    } else if (trimmed === "clear" || trimmed === "\\c") {
      await ensureSession().clear_env();
      append("user-defined bindings cleared\n");
      handled = true;
    } else if (trimmed === "debug" || trimmed === "\\d") {
      const debug = await ensureSession().set_debug();
      if (debug === true) {
        append("debug is now on\n");
      } else if (debug === false) {
        append("debug is now off\n");
      }
      handled = true;
    } else if (trimmed === "box" || trimmed === "\\b") {
      const box = await ensureSession().set_box_mode();
      if (box === true) {
        append("box mode is now on\n");
      } else if (box === false) {
        append("box mode is now off\n");
      }
      handled = true;
    } else if (trimmed === "time" || trimmed === "\\t") {
      if (timeMode === true) {
        timeMode = false;
        append("time mode is now off\n");
      } else if (timeMode === false) {
        timeMode = true;
        append("time mode is now on\n");
      }
      handled = true;
    } else if (trimmed.startsWith("help")) {
      const arg = trimmed.slice(4).trim();
      const helpdoc = get_help_doc(arg);
      append(helpdoc + "\n");
      handled = true;
    } else if (trimmed.startsWith("\\h")) {
      const arg = trimmed.slice(2).trim();
      const helpdoc = get_help_doc(arg);
      append(helpdoc + "\n");
      handled = true;
    }

    if (handled) {
      // push into history for convenience
      if (!history.length || history[history.length - 1] !== code) {
        history.push(code);
      }
      histIndex = -1;
      pendingBuffer = "";
      // auto-clear input after successful handling
      codeEl.value = "";
      return;
    }

    // Otherwise, evaluate normally
    let start = performance.now();
    const out = await ensureSession().eval(code, {});
    let end = performance.now();

    console.log("repl received result" + out);
    // push into history if different from last
    if (!history.length || history[history.length - 1] !== code) {
      history.push(code);
    }
    histIndex = -1;
    pendingBuffer = "";
    if (out !== undefined && out !== null && String(out).length) {
      const formatted = String(out)
        .split("\n")
        .map((line, index) => (index === 0 ? line : "  " + line))
        .join("\n");
      append("\u{258D} " + formatted + "\n");

      if (timeMode === true) {
        append(`\u{258D} time elapsed: ${end - start}ms\n`);
      }
    }
    // auto-clear input after successful eval
    codeEl.value = "";
  } catch (err) {
    console.error(err);
    append((err?.message ?? String(err)) + "\n");
  } finally {
    evalBtn.disabled = false;
    // keep the code for iterative edits; users can clear manually
  }
}

evalBtn.addEventListener("click", (e) => {
  e.preventDefault();
  doEval();
});

clearBtn.addEventListener("click", () => {
  term.textContent = "";
});

codeEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    doEval();
  } else if (e.key === "Enter" && !e.shiftKey) {
    // single-line quick eval on Enter; allow Shift+Enter for newline
    e.preventDefault();
    doEval();
  } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey && e.key === "ArrowUp") {
    if (history.length) {
      e.preventDefault();
      if (histIndex === -1) {
        pendingBuffer = codeEl.value;
        histIndex = history.length - 1;
      } else if (histIndex > 0) {
        histIndex--;
      }
      codeEl.value = history[histIndex];
      // move caret to end
      codeEl.selectionStart = codeEl.selectionEnd = codeEl.value.length;
    }
  } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey && e.key === "ArrowDown") {
    if (history.length && histIndex !== -1) {
      e.preventDefault();
      if (histIndex < history.length - 1) {
        histIndex++;
        codeEl.value = history[histIndex];
      } else {
        histIndex = -1;
        codeEl.value = pendingBuffer;
      }
      codeEl.selectionStart = codeEl.selectionEnd = codeEl.value.length;
    }
  }
});

// boot a session now
resetSession();
