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
  // The README's "Ask an LLM about your usage": the summary document, the
  // skill and the AGENTS snippet. Beside Output because it is output, for a
  // different reader.
  { path: 'agents/', label: 'Agents', nav: true },
  // The guides `--agent-guide [TOPIC]` prints, one page each. Reached from the
  // Agents page's rail, not from the header: they are one subject, and the
  // header already names it.
  { path: 'agents/read/', label: 'Agent guide: reading', nav: false },
  { path: 'agents/setup/', label: 'Agent guide: setup', nav: false },
  { path: 'agents/recipes/', label: 'Agent guide: recipes', nav: false },
  { path: 'agents/extend/', label: 'Agent guide: extending', nav: false },
  { path: 'privacy/', label: 'Privacy', nav: true },
  // The launch write-up. One piece, so the entry is the piece; a second
  // one makes this an index.
  { path: 'what-a-max-subscription-bought/', label: 'Write-up', nav: true },
  { path: 'changelog/', label: 'Changelog', nav: true },
  // Reached from the home page's callout, not from the header: it argues a
  // point about the product rather than documenting part of it.
  { path: 'why-no-cursor/', label: 'Why there is no Cursor collector', nav: false },
];

/**
 * The agent guides: the route each is served at, the `docs` entry it renders,
 * and the command that prints the same text. The command is the link's label,
 * so the site says nothing about a guide that the flag does not.
 */
export interface Guide {
  topic: string;
  doc: string;
  command: string;
}

export const GUIDES: Guide[] = [
  { topic: 'read', doc: 'guide-read', command: '--agent-guide' },
  { topic: 'setup', doc: 'guide-setup', command: '--agent-guide setup' },
  { topic: 'recipes', doc: 'guide-recipes', command: '--agent-guide recipes' },
  { topic: 'extend', doc: 'guide-extend', command: '--agent-guide extend' },
];
