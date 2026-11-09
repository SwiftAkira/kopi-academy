// Tiny, safe text helpers shared by the server templates and the islands.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Inline markdown subset for quiz text and takeaways: `code`, **bold**, *emphasis*. Everything else is escaped. */
export function inlineMd(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

const PY_KEYWORDS = new Set(
  'and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'.split(
    ' ',
  ),
);
const PY_BUILTINS = new Set(
  'print len range int str float bool list dict set tuple sum min max abs round sorted enumerate zip input type isinstance any all reversed map filter open'.split(
    ' ',
  ),
);

/** Minimal Python highlighter for code shown inside islands. Output matches the Shiki theme colours. */
export function highlightPython(code: string): string {
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9])/g;
  let out = '';
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    last = re.lastIndex;
    const [tok, com, str, num, word] = m;
    if (com) out += `<span class="tk-com">${escapeHtml(tok)}</span>`;
    else if (str) out += `<span class="tk-str">${escapeHtml(tok)}</span>`;
    else if (num) out += `<span class="tk-num">${tok}</span>`;
    else if (word) {
      if (PY_KEYWORDS.has(word)) out += `<span class="tk-kw">${word}</span>`;
      else if (PY_BUILTINS.has(word)) out += `<span class="tk-fn">${word}</span>`;
      else out += word;
    } else out += escapeHtml(tok);
  }
  if (last < code.length) out += escapeHtml(code.slice(last));
  return out;
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`;
}
