/**
 * Baidu Search via browser DOM parsing.
 * Uses browser automation to extract search results from HTML.
 */
import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

cli({
    site: 'baidu',
    name: 'search',
    description: 'Search Baidu',
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
        const url = `https://www.baidu.com/s?wd=${query}`;

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract search results from DOM
        const items = await page.evaluate(`(async () => {
            const results = document.querySelectorAll('.result.c-container');
            const data = [];
            results.forEach((r, i) => {
                const titleEl = r.querySelector('h3 a') || r.querySelector('.t a');
                const snippetEl = r.querySelector('.c-abstract') || r.querySelector('.c-color');
                if (titleEl) {
                    data.push({
                        title: titleEl.textContent || '',
                        baiduUrl: titleEl.href || '',
                        snippet: snippetEl?.textContent || ''
                    });
                }
            });
            return data;
        })()`);

        if (!items || !items.length) {
            throw new CliError('NOT_FOUND', 'No search results found', 'Try a different query');
        }

        // Resolve real URLs by following redirects
        const resolvedItems = await Promise.all(
            items.slice(0, limit).map(async (item) => {
                let realUrl = item.baiduUrl;
                // If it's a Baidu redirect link, follow it to get real URL
                if (item.baiduUrl.includes('baidu.com/link?url=')) {
                    try {
                        const resp = await fetch(item.baiduUrl, { method: 'HEAD', redirect: 'follow' });
                        realUrl = resp.url;
                    } catch (e) {
                        // Keep original URL if resolve fails
                        realUrl = item.baiduUrl;
                    }
                }
                return {
                    title: item.title || '',
                    snippet: item.snippet || '',
                    url: realUrl,
                };
            })
        );

        return resolvedItems;
    },
});