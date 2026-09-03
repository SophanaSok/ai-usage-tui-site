// The site's own routes, in the order the header lists them.
//
// One table, so the nav, the sitemap and the tests cannot drift apart. Like
// `source.ts` this is erasable TypeScript, because the tests import it under
// Node's type stripping.

export interface Page {
  /** Path under the site root, without `base`, e.g. `install/`. */
  path: string;
  label: string;
  /** Shown in the header. Every page here is in the sitemap either way. */
  nav: boolean;
}

export const PAGES: Page[] = [
  { path: '', label: 'Home', nav: true },
  { path: 'install/', label: 'Install', nav: true },
  { path: 'sources/', label: 'Sources', nav: true },
  { path: 'dashboard/', label: 'Dashboard', nav: true },
  { path: 'routing/', label: 'Routing', nav: true },
  { path: 'output/', label: 'Output', nav: true },
  { path: 'privacy/', label: 'Privacy', nav: true },
  // The launch write-up. One piece, so the entry is the piece; a second
  // one makes this an index.
  { path: 'what-a-max-subscription-bought/', label: 'Write-up', nav: true },
  { path: 'changelog/', label: 'Changelog', nav: true },
  // Reached from the home page's callout, not from the header: it argues a
  // point about the product rather than documenting part of it.
  { path: 'why-no-cursor/', label: 'Why there is no Cursor collector', nav: false },
];
