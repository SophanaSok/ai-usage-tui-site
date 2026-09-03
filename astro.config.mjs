import { defineConfig } from 'astro/config';

export default defineConfig({
  // A GitHub Pages project site: the origin belongs to the account, the
  // repository name is the path. Every internal link and asset carries `base`.
  site: 'https://sophanasok.github.io',
  base: '/ai-usage-tui-site',
  security: {
    // A policy in a <meta>, since Pages sets no headers. Astro hashes the
    // scripts and stylesheets it processes; styles also allow inline because
    // the hero's stagger and the code highlighter both write style attributes.
    // Nothing else is loaded from anywhere but this origin.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ],
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  markdown: {
    // The site is dark only, so one highlighter theme, inlined by Astro. The
    // block background is overridden in base.css to sit on the page's surface.
    shikiConfig: { theme: 'github-dark-default' },
  },
});
