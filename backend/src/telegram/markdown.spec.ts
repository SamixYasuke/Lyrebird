import { markdownToTelegramHtml, escapeHtml } from '@/telegram/markdown';

describe('markdownToTelegramHtml', () => {
  it('converts bold and italic inline markers', () => {
    expect(markdownToTelegramHtml('**bold** and *italic*')).toBe(
      '<b>bold</b> and <i>italic</i>',
    );
  });

  it('converts inline code and escapes HTML entities', () => {
    expect(markdownToTelegramHtml('Use `a < b` & be careful')).toBe(
      'Use <code>a &lt; b</code> &amp; be careful',
    );
  });

  it('converts headings and unordered lists', () => {
    expect(markdownToTelegramHtml('# Big\n- one\n- two')).toBe(
      '<b>Big</b>\n• one\n• two',
    );
  });

  it('converts links', () => {
    expect(markdownToTelegramHtml('[docs](https://example.com)')).toBe(
      '<a href="https://example.com">docs</a>',
    );
  });

  it('renders a markdown table as bullet-separated lines', () => {
    const table = [
      '| Name | Use |',
      '|------|-----|',
      '| Full-grain | wallets |',
      '| Suede | linings |',
    ].join('\n');

    expect(markdownToTelegramHtml(table)).toBe(
      '<b>Name</b> • <b>Use</b>\nFull-grain • wallets\nSuede • linings',
    );
  });

  it('processes markdown and escapes HTML inside table cells', () => {
    const table = [
      '| **Plan** | **Actions** |',
      '|----------|-------------|',
      '| Switch plans | change as needed<br>• upgrade |',
    ].join('\n');

    expect(markdownToTelegramHtml(table)).toBe(
      '<b>Plan</b> • <b>Actions</b>\nSwitch plans • change as needed&lt;br&gt;• upgrade',
    );
  });

  it('keeps code blocks as preformatted text', () => {
    const code = '```ts\nconst x = 1 < 2;\n```';
    expect(markdownToTelegramHtml(code)).toBe(
      '<pre>const x = 1 &lt; 2;</pre>',
    );
  });

  it('does not corrupt user text containing asterisks', () => {
    expect(escapeHtml('A * B')).toBe('A * B');
  });
});
