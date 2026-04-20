# Creating OpenCLI Adapters

This guide explains how to create new OpenCLI adapters and save them to this repository.

## Quick Start

### Step 1: Explore the Target Site

Use OpenCLI's built-in explorer to understand the site's structure:

```bash
# Open the site in browser automation mode
opencli browser open "https://example.com"

# Check available elements
opencli browser state

# Take a screenshot for reference
opencli browser screenshot example.png
```

### Step 2: Identify API or DOM Structure

Two main strategies:

1. **API Strategy**: If the site has JSON API endpoints
   - Use `opencli browser network` to capture API calls
   - Extract endpoint URLs, parameters, and response structure

2. **DOM Strategy**: If no API available, parse HTML
   - Use `opencli browser eval` to test selectors
   - Extract data from page elements

### Step 3: Create Adapter File

Create a new file in the repository:

```bash
mkdir -p site-name
touch site-name/command.js
```

### Step 4: Write Adapter Code

Basic template for DOM-based adapter:

```javascript
/**
 * Site Name - Command Description.
 * Strategy: COOKIE (browser) or API (fetch)
 */
import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

cli({
    site: 'site-name',
    name: 'command',
    description: 'Command description',
    strategy: Strategy.COOKIE,  // or Strategy.API
    browser: true,  // required for COOKIE strategy
    args: [
        { name: 'query', positional: true, required: true, help: 'Input parameter' },
        { name: 'limit', type: 'int', default: 10, help: 'Max results' },
    ],
    columns: ['title', 'url', 'snippet'],  // output columns
    func: async (page, args) => {
        const limit = Math.max(1, Math.min(Number(args.limit), 25));
        const url = `https://example.com/search?q=${encodeURIComponent(args.query)}`;

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract data from DOM
        const items = await page.evaluate(`(async () => {
            const results = document.querySelectorAll('.result-item');
            const data = [];
            results.forEach((r) => {
                const titleEl = r.querySelector('.title a');
                const snippetEl = r.querySelector('.snippet');
                if (titleEl) {
                    data.push({
                        title: titleEl.textContent || '',
                        url: titleEl.href || '',
                        snippet: snippetEl?.textContent || ''
                    });
                }
            });
            return data;
        })()`);

        if (!items || !items.length) {
            throw new CliError('NOT_FOUND', 'No results found', 'Try different query');
        }

        return items.slice(0, limit);
    },
});
```

### Step 5: Test Locally

```bash
# Copy to OpenCLI directory
cp -r site-name ~/.opencli/clis/

# Test the command
opencli site-name command "test query" --limit 5
```

### Step 6: Debug if Needed

```bash
# Open browser to inspect
opencli browser open "https://example.com/search?q=test"

# Test selectors
opencli browser eval "document.querySelectorAll('.result-item').length"

# Check specific element
opencli browser eval "document.querySelector('.result-item').outerHTML.substring(0,500)"
```

## Strategy Types

| Strategy | Use Case | Requires Browser |
|----------|----------|------------------|
| `Strategy.API` | Sites with JSON APIs | No |
| `Strategy.COOKIE` | Sites requiring login/session | Yes |
| `Strategy.PUBLIC` | Simple public pages | No |

## Common Patterns

### URL Redirect Resolution

Many search engines use redirect links. Resolve them:

```javascript
// For JS-based redirects (fetch HTML and parse)
const resp = await fetch(redirectUrl);
const html = await resp.text();
const match = html.match(/window\.location\.replace\("([^"]+)"\)/);
const realUrl = match ? match[1] : redirectUrl;

// For HTTP redirects
const resp = await fetch(redirectUrl, { method: 'HEAD', redirect: 'follow' });
const realUrl = resp.url;
```

### Handling Pagination

```javascript
// Add page argument
{ name: 'page', type: 'int', default: 1, help: 'Page number' }

// Construct URL with pagination
const url = `https://example.com/search?q=${query}&page=${args.page}`;
```

### Error Handling

```javascript
import { CliError } from '@jackwener/opencli/errors';

// Site-specific errors
throw new CliError('NOT_FOUND', 'No results', 'Try different query');
throw new CliError('RATE_LIMITED', 'Too many requests', 'Wait and retry');
```

## Complete Example: Search Engine Adapter

See existing adapters for reference:
- [bing/search.js](bing/search.js) - Bing with URL decoding
- [baidu/search.js](baidu/search.js) - Baidu with redirect resolution
- [sogou/search.js](sogou/search.js) - Sogou with JS redirect parsing

## Publishing to Repository

After testing:

1. Ensure adapter is in the repository directory
2. Update README.md to list the new adapter
3. Commit and push:

```bash
git add site-name/
git commit -m "Add site-name adapter"
git push
```

## Resources

- [OpenCLI Documentation](https://github.com/jackwener/opencli)
- [OpenCLI Registry Reference](https://github.com/jackwener/opencli/blob/main/docs/registry.md)
- [Puppeteer API](https://ppuppeteer.github.io/puppeteer/) (for browser automation)