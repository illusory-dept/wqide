// Lightweight, hand-rolled Markdown parser tailored to our needs.
// Supports: headings, paragraphs, lists, code fences, inline code,
// bold (**text** -> <strong>), italic (*text* -> <em>), links, and escaping.
// Special styling handled via CSS (strong=red, em=blue normal).

(function(){
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function inlineParse(raw) {
    // Protect inline code first using placeholders
    const codeSpans = [];
    let text = raw.replace(/`([^`]+)`/g, (m, code) => {
      const idx = codeSpans.push(code) - 1;
      return `\uE000CODE${idx}\uE000`;
    });

    // Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+\"([^\"]+)\")?\)/g, (m, label, url, title) => {
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(url)}"${t}>${escapeHtml(label)}</a>`;
    });

    // Bold (**text**)
    text = text.replace(/\*\*([^*]+)\*\*/g, (m, b) => `<strong>${escapeHtml(b)}</strong>`);

    // Italic (*text*) — avoid matching inside ** ** by using a tempered pattern
    text = text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, (m, pre, i) => `${pre}<em>${escapeHtml(i)}</em>`);

    // Restore code spans (escaped, not further formatted)
    text = text.replace(/\uE000CODE(\d+)\uE000/g, (m, i) => `<code>${escapeHtml(codeSpans[Number(i)])}</code>`);
    return text;
  }

  function parseMarkdown(md) {
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let i = 0;
    let inCode = false;
    let codeLang = "";
    let codeBuf = [];
    let listType = null; // 'ul' | 'ol'
    let listBuf = [];
    let paraBuf = [];

    // --- Table helpers (GFM-style pipe tables) ---
    function splitTableRow(row) {
      // Split on unescaped pipes. Support \\ and \| escapes within cells.
      let s = row.trim();
      if (s.startsWith('|')) s = s.slice(1);
      if (s.endsWith('|')) s = s.slice(0, -1);
      const cells = [];
      let buf = '';
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '\\') {
          if (i + 1 < s.length) {
            // consume next char literally
            buf += s[i + 1];
            i++;
          } else {
            // trailing backslash
            buf += '\\';
          }
        } else if (ch === '|') {
          cells.push(buf.trim());
          buf = '';
        } else {
          buf += ch;
        }
      }
      cells.push(buf.trim());
      return cells;
    }
    function isAlignRow(line) {
      if (!line || !/\|/.test(line)) return false;
      const cells = splitTableRow(line);
      if (!cells.length) return false;
      return cells.every((seg) => /:?\s*-{3,}\s*:?(\s*)?$/.test(seg));
    }
    function parseAlign(seg) {
      const t = seg.replace(/\s+/g, '');
      if (t.startsWith(':') && t.endsWith(':')) return 'center';
      if (t.startsWith(':')) return 'left';
      if (t.endsWith(':')) return 'right';
      return '';
    }
    function isTableStartAt(idx) {
      const headerLine = lines[idx];
      const next = lines[idx + 1];
      if (!headerLine || !next) return false;
      // Must have at least one unescaped pipe to split into >1 cells
      const headerCells = splitTableRow(headerLine);
      if (headerCells.length <= 1) return false;
      return isAlignRow(next);
    }
    function tryParseTable() {
      const headerLine = lines[i];
      const next = lines[i + 1];
      if (!isTableStartAt(i)) return false;
      // Parse header + alignment
      const headers = splitTableRow(headerLine);
      const aligns = splitTableRow(next).map(parseAlign);
      const cols = Math.max(headers.length, aligns.length);
      const al = new Array(cols).fill('').map((_, idx) => aligns[idx] || '');
      i += 2; // consume header + align
      const bodyRows = [];
      while (i < lines.length && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) {
        bodyRows.push(splitTableRow(lines[i]));
        i++;
      }
      // Build HTML
      const theadCells = headers
        .map((h, idx) => {
          const a = al[idx] ? ` style="text-align:${al[idx]}"` : '';
          return `<th${a}>${inlineParse(h)}</th>`;
        })
        .join('');
      const thead = `<thead><tr>${theadCells}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map((row) => {
          const cells = row
            .map((c, idx) => {
              const a = al[idx] ? ` style=\"text-align:${al[idx]}\"` : '';
              return `<td${a}>${inlineParse(c)}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('')}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      return true;
    }

    function flushParagraph() {
      if (paraBuf.length) {
        const text = paraBuf.join(" ").trim();
        if (text) out.push(`<p>${inlineParse(text)}</p>`);
        paraBuf = [];
      }
    }
    function flushList() {
      if (listBuf.length) {
        const tag = listType === 'ol' ? 'ol' : 'ul';
        out.push(`<${tag}>`);
        listBuf.forEach(item => out.push(`<li>${inlineParse(item)}</li>`));
        out.push(`</${tag}>`);
        listBuf = [];
        listType = null;
      }
    }
    function flushCode() {
      if (inCode) {
        out.push(`<pre><code${codeLang ? ` class="language-${codeLang}"` : ''}>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        inCode = false; codeLang = ""; codeBuf = [];
      }
    }

    while (i < lines.length) {
      const line = lines[i];

      // Code fence
      const fenceMatch = line.match(/^```\s*([a-zA-Z0-9_-]+)?\s*$/);
      if (fenceMatch) {
        if (!inCode) {
          // entering code
          flushParagraph();
          flushList();
          inCode = true;
          codeLang = fenceMatch[1] || "";
        } else {
          // leaving code
          flushCode();
        }
        i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }

      // Blank line
      if (/^\s*$/.test(line)) {
        flushParagraph();
        flushList();
        i++; continue;
      }

      // Heading #..######
      const h = line.match(/^(#{1,6})\s+(.+)$/);
      if (h) {
        flushParagraph();
        flushList();
        const level = h[1].length;
        const text = h[2].trim();
        out.push(`<h${level}>${inlineParse(text)}</h${level}>`);
        i++; continue;
      }

      // Table
      if (isTableStartAt(i)) { flushParagraph(); flushList(); tryParseTable(); continue; }

      // Ordered list
      const ol = line.match(/^\s*\d+\.\s+(.+)$/);
      if (ol) {
        flushParagraph();
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listBuf.push(ol[1]);
        i++; continue;
      }
      // Unordered list
      const ul = line.match(/^\s*[-*]\s+(.+)$/);
      if (ul) {
        flushParagraph();
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listBuf.push(ul[1]);
        i++; continue;
      }

      // Paragraph line (merge consecutive lines)
      paraBuf.push(line.trim());
      i++;
    }
    // final flush
    flushCode();
    flushParagraph();
    flushList();

    return out.join("\n");
  }

  // expose
  window.parseMarkdown = parseMarkdown;
})();
