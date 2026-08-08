const PLACEHOLDER = '\u0000';

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

function inline(md: string): string {
  const placeholders: string[] = [];
  const stash = (replaced: string): string => {
    placeholders.push(replaced);
    return `${PLACEHOLDER}${placeholders.length - 1}${PLACEHOLDER}`;
  };

  let out = md
    .replace(/`([^`]+)`/g, (_match, code: string) =>
      stash(`<code>${escapeHtml(code)}</code>`),
    )
    .replace(/\*\*([^*]+)\*\*/g, (_match, bold: string) =>
      stash(`<b>${bold}</b>`),
    )
    .replace(
      /(^|\s)\*([^*\s](?:[^*\n]*[^*\s])?)\*(?!\*)/g,
      (_match, pre, italic: string) => `${pre}${stash(`<i>${italic}</i>`)}`,
    )
    .replace(
      /(^|\s)__([^_\s](?:[^_\n]*[^_\s])?)__(?!_)/g,
      (_match, pre, bold: string) => `${pre}${stash(`<b>${bold}</b>`)}`,
    )
    .replace(
      /(^|\s)_([^_\s](?:[^_\n]*[^_\s])?)_(?!_)/g,
      (_match, pre, italic: string) => `${pre}${stash(`<i>${italic}</i>`)}`,
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_match, label, url: string) => stash(`<a href="${escapeHtml(url)}">${label}</a>`),
    );

  out = escapeHtml(out);
  return out.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g'), (_match, index: string) => placeholders[Number(index)]);
}

function splitCells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

export function markdownToTelegramHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;
  let table: string[][] | null = null;

  const flushTable = (): void => {
    if (!table) return;
    table.forEach((cells, rowIndex) => {
      const rendered = cells
        .map((cell) => {
          const processed = inline(cell);
          return rowIndex === 0 && !processed.includes('<b>')
            ? `<b>${processed}</b>`
            : processed;
        })
        .join(' • ');
      out.push(rendered);
    });
    table = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');

    if (/^\s*```/.test(line)) {
      flushTable();
      if (inCodeBlock) {
        inCodeBlock = false;
        out.push('');
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      out.push(`<pre>${escapeHtml(line)}</pre>`);
      continue;
    }

    if (line.trim().startsWith('|')) {
      const cells = splitCells(line);
      if (cells.length === 0) continue;
      if (isTableSeparator(cells)) {
        if (!table) continue;
      } else {
        if (!table) table = [];
        table.push(cells);
      }
      continue;
    }

    flushTable();

    const trimmed = line.trim();
    if (trimmed.length === 0) {
      out.push('');
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      out.push(`<b>${inline(heading[2])}</b>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      out.push(`• ${inline(bullet[1])}`);
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      out.push(inline(quote[1]));
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (ordered) {
      out.push(inline(ordered[1]));
      continue;
    }

    out.push(inline(line));
  }

  if (inCodeBlock) out.push('<pre></pre>');
  flushTable();

  return out.join('\n').trim();
}
