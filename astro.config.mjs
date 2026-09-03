import { defineConfig } from 'astro/config';

export default defineConfig({
  // A GitHub Pages project site: the origin belongs to the account, the
  // repository name is the path. Every internal link and asset carries `base`.
  site: 'https://sophanasok.github.io',
  base: '/ai-usage-tui-site',
  markdown: {
    // The site is dark only, so one highlighter theme, inlined by Astro. The
    // block background is overridden in base.css to sit on the page's surface.
    shikiConfig: { theme: 'github-dark-default' },
  },
});
