---
name: opencli-adapter-creator
description: Use when creating new OpenCLI adapters, adding custom CLI commands for websites, or writing adapter code for search engines and other web services. Covers DOM parsing, API integration, URL resolution, and adapter structure conventions.
tags: [opencli, adapter, cli, browser, dom-parsing, web-scraping, search-engine]
---

# OpenCLI Adapter Creator Guide

> Create custom OpenCLI adapters for websites (search engines, APIs, etc.)

## Quick Reference

| Task | Approach |
|------|----------|
| Create search engine adapter | DOM parsing + URL resolution |
| Create API adapter | `Strategy.API` + fetch |
| Create authenticated adapter | `Strategy.COOKIE` + browser |
| Test adapter | Copy to `~/.opencli/clis/` + run |

---

## Adapter Structure

Each adapter is a single JS file:

```
site-name/
└── command.js    # CLI definition
```

Install location:
- **Repo contribution**: `clis/<site>/<name>.js` + `npm run build`
- **Private adapter**: `~/.opencli/clis/<site>/<name>.js` (no build needed)

---

## Strategy Types

| Strategy | Use Case | Browser | Speed |
|----------|----------|---------|-------|
| `Strategy.PUBLIC` | Open APIs, no auth | `false` | ~1s |
| `Strategy.API` | JSON APIs | `false` | ~1s |
| `Strategy.COOKIE` | Cookie-based auth | `true` | ~7s |
| `Strategy.HEADER` | CSRF/Bearer tokens | `true` | ~7s |
| `Strategy.INTERCEPT` | Complex signing | `true` | ~10s |

---

## Template: DOM-Based Search Adapter

Most search engines use redirect links. Use this pattern:

```javascript
import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

cli({
  site: 'mysite',
  name: 'search',
  description: 'Search MySite',
  domain: 'www.example.com',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'query', positional: true, required: true, help: 'Search query' },
    { name: 'limit', type: 'int', default: 10, help: 'Max results (max 25)' },
  ],
  columns: ['title', 'snippet', 'url'],
  func: async (page, args) => {
    const limit = Math.max(1, Math.min(Number(args.limit), 25));
    const url = `https://www.example.com/search?q=${encodeURIComponent(args.query)}`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const items = await page.evaluate(`(async () => {
      const results = document.querySelectorAll('.result-item');
      const data = [];
      results.forEach((r) => {
        const titleEl = r.querySelector('.title a');
        const snippetEl = r.querySelector('.snippet');
        if (titleEl) {
          data.push({
            title: titleEl.textContent || '',
            siteUrl: titleEl.href || '',
            snippet: snippetEl?.textContent || ''
          });
        }
      });
      return data;
    })()`);

    if (!items || !items.length) {
      throw new CliError('NOT_FOUND', 'No results found', 'Try different query');
    }

    return items.slice(0, limit).map(item => ({
      title: item.title || '',
      snippet: item.snippet || '',
      url: item.siteUrl || '',
    }));
  },
});
```

---

## URL Resolution Patterns

Search engines often use redirect links. Resolve them:

### HTTP Redirect (Baidu-style)

```javascript
if (item.siteUrl.includes('example.com/link?url=')) {
  try {
    const resp = await fetch(item.siteUrl, { method: 'HEAD', redirect: 'follow' });
    realUrl = resp.url;
  } catch (e) {
    realUrl = item.siteUrl;
  }
}
```

### JS Redirect (Sogou-style)

```javascript
if (item.siteUrl.includes('example.com/link')) {
  try {
    const resp = await fetch(item.siteUrl);
    const html = await resp.text();
    const match = html.match(/window\.location\.replace\("([^"]+)"\)/);
    realUrl = match ? match[1] : item.siteUrl;
  } catch (e) {
    realUrl = item.siteUrl;
  }
}
```

### Base64 Encoding (Bing-style)

```javascript
function decodeUrl(encodedUrl) {
  const match = encodedUrl.match(/u=a1([a-zA-Z0-9+/=]+)/);
  if (match && match[1]) {
    try {
      return Buffer.from(match[1], 'base64').toString('utf-8');
    } catch (e) {}
  }
  return encodedUrl;
}
```

---

## API-Based Adapter

For sites with JSON APIs:

```javascript
import { cli, Strategy } from '@jackwener/opencli/registry';

cli({
  site: 'mysite',
  name: 'list',
  description: 'List items',
  domain: 'api.example.com',
  strategy: Strategy.API,
  browser: false,
  args: [
    { name: 'limit', type: 'int', default: 20 },
  ],
  columns: ['id', 'title', 'value'],
  func: async (page, args) => {
    const res = await fetch('https://api.example.com/items?limit=' + args.limit);
    const data = await res.json();
    return (data.items || []).slice(0, args.limit);
  },
});
```

---

## Error Handling

```javascript
import { CliError } from '@jackwener/opencli/errors';

// Site-specific errors
throw new CliError('NOT_FOUND', 'No results', 'Try different query');
throw new CliError('RATE_LIMITED', 'Too many requests', 'Wait and retry');
throw new CliError('AUTH_REQUIRED', 'Login required', 'Open browser and login');
```

---

## Testing

```bash
# Copy to OpenCLI directory
cp -r site-name ~/.opencli/clis/

# Run the command
opencli site-name search "test query" --limit 5
```

**Done criteria**: Command returns non-empty table with expected columns.

---

## Existing Examples

| Adapter | Features |
|---------|----------|
| [baidu/search.js](../baidu/search.js) | Cookie + HTTP redirect resolution |
| [bing/search.js](../bing/search.js) | Cookie + Base64 URL decoding |
| [sogou/search.js](../sogou/search.js) | Cookie + JS redirect parsing |

---

## Advanced Topics

For full exploration workflow (API discovery, auth cascade, intercept mode), see:
- [opencli-explorer skill](https://github.com/jackwener/opencli) - Complete site exploration
- [opencli-oneshot skill](https://github.com/jackwener/opencli) - Quick single-command generation

---

## Resources

- [OpenCLI Documentation](https://github.com/jackwener/opencli)
- [OpenCLI Registry Reference](https://github.com/jackwener/opencli/blob/main/docs/registry.md)
- [Puppeteer API](https://ppuppeteer.github.io/puppeteer/) - Browser automation