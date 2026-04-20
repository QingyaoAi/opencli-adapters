/**
 * Bing Search via browser DOM parsing.
 * Uses browser automation to extract search results from HTML.
 * Decodes real URLs from Bing redirect links.
 */
import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

// Decode real URL from Bing redirect link
// Format: https://www.bing.com/ck/a?!&&...&u=a1<base64_encoded_url>
function decodeBingUrl(bingUrl) {
    if (!bingUrl) return '';
    // Extract u parameter
    const match = bingUrl.match(/u=a1([a-zA-Z0-9+/=]+)/);
    if (match && match[1]) {
        try {
            // Bing uses a variant of base64 where a1 prefix indicates URL type
            // Decode the base64 part
            const base64 = match[1];
            const decoded = Buffer.from(base64, 'base64').toString('utf-8');
            return decoded;
        } catch (e) {
            // If decode fails, return original URL
            return bingUrl;
        }
    }
    // If not a redirect link, return as-is
    return bingUrl;
}

cli({
    site: 'bing',
    name: 'search',
    description: 'Search Bing',
    strategy: Strategy.COOKIE,
    browser: true,
    args: [
        { name: 'query', positional: true, required: true, help: 'Search query' },
        { name: 'limit', type: 'int', default: 10, help: 'Max results (max 25)' },
    ],
    columns: ['title', 'snippet', 'url'],
    func: async (page, args) => {
        const limit = Math.max(1, Math.min(Number(args.limit), 25));
        const query = encodeURIComponent(args.query);
        const url = `https://www.bing.com/search?q=${query}`;

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract search results from DOM
        const items = await page.evaluate(`(async () => {
            const results = document.querySelectorAll('.b_algo');
            const data = [];
            results.forEach((r, i) => {
                const titleEl = r.querySelector('h2 a');
                const snippetEl = r.querySelector('.b_caption p') || r.querySelector('p');
                if (titleEl) {
                    data.push({
                        title: titleEl.textContent || '',
                        bingUrl: titleEl.href || '',
                        snippet: snippetEl?.textContent || ''
                    });
                }
            });
            return data;
        })()`);

        if (!items || !items.length) {
            throw new CliError('NOT_FOUND', 'No search results found', 'Try a different query');
        }

        return items.slice(0, limit).map(item => ({
            title: item.title || '',
            snippet: item.snippet || '',
            url: decodeBingUrl(item.bingUrl),
        }));
    },
});