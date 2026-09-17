// The one place that says what the site trusts and where it comes from.
//
// Everything on the site that describes the product is read from the
// ai-usage-tui checkout named here. This file is erasable TypeScript only
// (types and `as const`, no enums or parameter properties) so that
// `tests/site.test.mjs` can import it under Node's built-in type stripping.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const REPO = 'https://github.com/SophanaSok/ai-usage-tui';
export const RAW_MAIN = 'https://raw.githubusercontent.com/SophanaSok/ai-usage-tui/main/';

/** The directory under `public/` the checkout's images are copied into. */
export const ASSET_DIR = 'aiu';

/** Images copied out of the checkout into `public/aiu/`. */
export const ASSETS = [
  'docs/assets/demo.gif',
  'docs/assets/dashboard.png',
  'docs/assets/budgets.png',
  'docs/assets/routing.png',
  'docs/assets/projects.png',
  'docs/assets/timeseries.png',
  'docs/assets/burn.png',
  'docs/assets/sessions.png',
  'docs/assets/limits.png',
] as const;

/**
 * Text the pages are rendered from. The two scripts are trusted for one
 * purpose only: they are where the invented names in the README screenshots
 * come from, so the hero's copy of those names is checked against them.
 */
export const TEXT = {
  cargo: 'Cargo.toml',
  readme: 'README.md',
  changelog: 'CHANGELOG.md',
  routing: 'docs/routing-analytics.md',
  measurement: 'docs/what-a-max-subscription-bought.md',
  // The four guides the binary prints with `--agent-guide [TOPIC]`. They are
  // compiled into it because no install channel ships `docs/`; the site
  // renders the same files, so a reader without the binary can see what an
  // agent with it is told.
  guideRead: 'docs/agent-guide.md',
  guideSetup: 'docs/agent-setup.md',
  guideRecipes: 'docs/agent-recipes.md',
  guideExtend: 'docs/agent-extend.md',
  fixture: 'scripts/make-demo-fixture.py',
  renderer: 'scripts/render-readme-screenshots.sh',
} as const;

/**
 * Where the dashboard defines its colours. Read by `npm run check` only, to
 * hold `tokens.css` to them: a colour is a design decision about the site, so
 * a drift fails the check rather than the build.
 */
export const PALETTE_SOURCE = {
  classes: 'src/model.rs',
  theme: 'src/ui/theme.rs',
  terminal: 'src/ui/svg.rs',
} as const;

/**
 * The social card, resized at build time from a trusted screenshot.
 *
 * The screenshots are rendered at twice the terminal's cell grid, 2582x1568,
 * which is 1.65:1 against the card's 1.91:1. Fitting the height would leave
 * the tiles too small to read in a link preview, so the card takes the top of
 * the picture instead: the header, the six class tiles, the token flow and
 * the whole model table survive, and only the empty lower half of the two
 * panels and the footer are cut. The crop is 2582x1356, which is 1.904:1;
 * the last 0.04% is absorbed by a cover fit, not a stretch.
 */
export const OG = {
  /** Must be one of ASSETS. `sourceDir` checks it. */
  from: 'docs/assets/dashboard.png',
  file: 'og.png',
  width: 1200,
  height: 630,
  /** The size the crop below was chosen for; a regenerated screenshot at another size fails the build. */
  source: { width: 2582, height: 1568 },
  crop: { left: 0, top: 0, width: 2582, height: 1356 },
  /** The terminal's own background, used only to flatten alpha. */
  mat: '#0a1014',
} as const;

export const DEFAULT_SOURCE = '../ai-usage-tui';

/** Where the checkout is, verified to be one, with every trusted file present. */
export function sourceDir(): string {
  const dir = resolve(process.env.AIU_SRC ?? DEFAULT_SOURCE);
  const cargo = resolve(dir, TEXT.cargo);
  if (!existsSync(cargo) || !/^name = "ai-usage-tui"$/m.test(readFileSync(cargo, 'utf8'))) {
    throw new Error(`AIU_SRC=${dir} is not an ai-usage-tui checkout (no Cargo.toml naming the crate)`);
  }
  for (const file of [...ASSETS, ...Object.values(TEXT), ...Object.values(PALETTE_SOURCE)]) {
    if (!existsSync(resolve(dir, file))) throw new Error(`missing trusted file ${file} under ${dir}`);
  }
  const assets: readonly string[] = ASSETS;
  if (!assets.includes(OG.from)) {
    throw new Error(`the social card is rendered from ${OG.from}, which is not one of the trusted ASSETS`);
  }
  return dir;
}

export interface Release {
  /** Cargo `name`, which is also the crate's path on crates.io. */
  name: string;
  version: string;
  date: string;
  tag: string;
  description: string;
  repository: string;
  homepage: string;
  license: string;
  /** Cargo `authors[0]` with the address removed. See `readRelease`. */
  author: string;
  keywords: string[];
  categories: string[];
  rustVersion: string;
  /**
   * The first prose of the newest release's changelog entry, as markdown.
   * The changelog page describes itself with it, so it moves with every
   * release rather than being anchored to a phrase.
   */
  notes: string;
}

/** A `key = "value"` line of the crate manifest. */
function cargoField(cargo: string, key: string): string {
  const found = cargo.match(new RegExp(`^${key} = "([^"]+)"$`, 'm'));
  if (!found) throw new Error(`${TEXT.cargo} has no ${key}`);
  return found[1]!;
}

/** A `key = ["a", "b"]` line of the crate manifest. */
function cargoList(cargo: string, key: string): string[] {
  const found = cargo.match(new RegExp(`^${key} = \\[([^\\]]*)\\]`, 'm'));
  if (!found) throw new Error(`${TEXT.cargo} has no ${key}`);
  const values = [...found[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
  if (!values.length) throw new Error(`${TEXT.cargo} lists nothing under ${key}`);
  return values;
}

/**
 * The first prose of a changelog entry. The entries open with a `### Added`
 * group heading and then a list, so the lede is the first block that is not
 * a heading, with a list marker stripped and a bullet's indented continuation
 * lines folded into one paragraph.
 */
export function entryLede(body: string, where: string): string {
  const blocks = body
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  const first = blocks.find((b) => !/^#{1,6} /.test(b));
  if (!first) throw new Error(`${where} has no prose after its heading`);
  const lede = first.replace(/^[-*] /, '').replace(/\n\s+/g, ' ');
  if (/^[#|>]/.test(lede)) throw new Error(`${where} opens with something other than prose: ${lede.slice(0, 40)}`);
  return lede;
}

/**
 * The newest dated release in the changelog, and what the crate manifest says
 * about itself. `[Unreleased]` has no date and so never matches. When CI sets
 * AIU_TAG the checkout must agree with its own changelog.
 */
export function readRelease(dir: string): Release {
  const changelog = readFileSync(resolve(dir, TEXT.changelog), 'utf8');
  const heading = changelog.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/m);
  if (!heading) throw new Error(`${TEXT.changelog} has no dated release heading`);
  const version = heading[1]!;
  const date = heading[2]!;
  const tag = `v${version}`;
  const expected = process.env.AIU_TAG;
  if (expected && expected !== tag) {
    throw new Error(`checkout is ${expected} but its changelog's newest release is ${tag}`);
  }

  const rest = changelog.slice(heading.index! + heading[0]!.length);
  const next = rest.search(/^## /m);
  const notes = entryLede(next < 0 ? rest : rest.slice(0, next), `${TEXT.changelog}'s ${tag} entry`);

  const cargo = readFileSync(resolve(dir, TEXT.cargo), 'utf8');
  // Never let the address reach the page: the JSON-LD would publish it in
  // machine-readable form, which is a gift to address harvesters.
  const author = cargoList(cargo, 'authors')[0]!.replace(/\s*<[^>]*>$/, '');
  return {
    name: cargoField(cargo, 'name'),
    version,
    date,
    tag,
    description: cargoField(cargo, 'description'),
    repository: REPO,
    homepage: cargoField(cargo, 'homepage'),
    license: cargoField(cargo, 'license'),
    author,
    keywords: cargoList(cargo, 'keywords'),
    categories: cargoList(cargo, 'categories'),
    rustVersion: cargoField(cargo, 'rust-version'),
    notes,
  };
}

export interface ReleaseNote {
  version: string;
  tag: string;
  date: string;
  /** The entry's body, as markdown, down to the next release heading. */
  body: string;
}

/**
 * Every dated release the changelog records, newest first, for the feed.
 * `[Unreleased]` carries no date and so is never one of them.
 */
export function readReleases(dir: string): ReleaseNote[] {
  const changelog = readFileSync(resolve(dir, TEXT.changelog), 'utf8');
  const headings = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm)];
  if (!headings.length) throw new Error(`${TEXT.changelog} has no dated release heading`);
  return headings.map((heading, i) => {
    const from = heading.index! + heading[0]!.length;
    const next = headings[i + 1];
    const body = changelog.slice(from, next ? next.index! : undefined);
    return { version: heading[1]!, tag: `v${heading[1]!}`, date: heading[2]!, body: body.trim() };
  });
}

/** Text as an XML text node or attribute value. */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * A short string the site writes by hand, checked to be verbatim in a trusted
 * file. Rendered markdown cannot supply a command literally — the highlighter
 * splits it across spans — so the few commands and phrases the page types out
 * itself are quoted through here, and the build fails when the source stops
 * saying them.
 */
export function quote(haystack: string, needle: string, where: string): string {
  if (!haystack.includes(needle)) {
    throw new Error(`${where} no longer contains ${JSON.stringify(needle)}, which the site quotes verbatim`);
  }
  return needle;
}

/**
 * The date a piece was written, from the `*Written YYYY-MM-DD …*` line it
 * opens with. A page made from such a document dates itself by this rather
 * than by the release, so the feed and the article tags say when the words
 * were true, not when the checkout was cut.
 */
export function writtenOn(md: string, where: string): string {
  const found = md.match(/^\*Written (\d{4}-\d{2}-\d{2}) /m);
  if (!found) throw new Error(`${where} does not open with a "*Written YYYY-MM-DD" line`);
  return found[1]!;
}

/* ---- Describing a page with its own document ------------------------------
 *
 * A page's meta description is a paragraph of the document that page renders.
 * The site chooses which paragraph; the document supplies every word of it.
 * The anchor goes through `quote()`, so a document that stops saying it fails
 * the build rather than shipping a description of a page that moved on.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
};

/**
 * Rendered HTML as one line of plain text. Runs on HTML rather than on
 * markdown so that a code span survives: the renderer has already escaped
 * `<id>` to `&lt;id&gt;`, and decoding entities after the tags are gone is
 * what keeps it, rather than eating it as a tag.
 */
export function plainText(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/blockquote)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(\w+|#\d+);/g, (all, name: string) => ENTITIES[name] ?? all)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * `text` cut to `limit`, at a sentence boundary if there is a usable one, then
 * a clause, then a word. Cutting mid-sentence can change what a sentence
 * asserts, so the shipped string is always a whole one: the clause cut closes
 * with a full stop, and only the word cut — the last resort — trails off.
 */
export function clamp(text: string, limit = 155): string {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit);
  const sentence = head.lastIndexOf('. ');
  if (sentence >= 70) return head.slice(0, sentence + 1);
  const clause = Math.max(head.lastIndexOf(', '), head.lastIndexOf('; '), head.lastIndexOf(' — '));
  if (clause >= 90) return head.slice(0, clause) + '.';
  return head.slice(0, head.lastIndexOf(' ')).replace(/[,;:—-]$/, '') + '…';
}

/** The paragraph of a trusted document that opens with `starts`. */
export function ledeParagraph(md: string, starts: string, where: string): string {
  const at = md.indexOf(quote(md, starts, where));
  const gap = md.indexOf('\n\n', at);
  return md.slice(at, gap < 0 ? undefined : gap).trim();
}

export interface AssetSize {
  width: number;
  height: number;
}

/**
 * An asset's intrinsic size, read out of the asset itself so a regenerated
 * screenshot cannot leave the page reserving the wrong box. A GIF carries its
 * logical screen in bytes 6 to 9, little endian; a PNG carries its IHDR width
 * and height in bytes 16 to 23, big endian.
 */
export function assetSize(dir: string, file: string): AssetSize {
  const path = resolve(dir, file);
  if (file.endsWith('.png')) {
    const head = readFileSync(path).subarray(0, 24);
    if (head.subarray(1, 4).toString('latin1') !== 'PNG') throw new Error(`${file} is not a PNG`);
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  }
  if (file.endsWith('.gif')) {
    const head = readFileSync(path).subarray(0, 10);
    const width = head.readUInt16LE(6);
    const height = head.readUInt16LE(8);
    if (!width || !height) throw new Error(`${file} has no logical screen size`);
    return { width, height };
  }
  throw new Error(`${file}: no size reader for this kind of asset`);
}

export interface SliceOptions {
  /** Keep the `## Heading` line itself. */
  keepHeading?: boolean;
  /** Lift every heading one level, so a `##` section can be a page's `#`. */
  promote?: boolean;
  /**
   * Stop at the first line starting with this, when there is one. Lets a page
   * take a section's prose without a figure the page shows for itself further
   * down, instead of printing the same picture twice.
   */
  until?: string;
  /** Start at the first line equal to this, inside the section, keeping that line. */
  from?: string;
}

/** One `## Heading` section of a markdown file, up to the next `## `. */
export function sliceSection(md: string, heading: string, opts: SliceOptions = {}): string {
  const lines = md.split('\n');
  let start = lines.findIndex((line) => line === `## ${heading}`);
  if (start < 0) throw new Error(`no "## ${heading}" section`);
  let end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  if (end < 0) end = lines.length;
  let body: string[];
  if (opts.from) {
    const at = lines.findIndex((line, i) => i > start && i < end && line === opts.from);
    if (at < 0) throw new Error(`"## ${heading}" has no line ${JSON.stringify(opts.from)}`);
    body = lines.slice(at, end);
  } else {
    if (opts.until) {
      const cut = lines.findIndex((line, i) => i > start && i < end && line.startsWith(opts.until!));
      if (cut > start) end = cut;
    }
    body = lines.slice(opts.keepHeading ? start : start + 1, end);
  }
  if (opts.promote) body = body.map((line) => (/^#{2,6} /.test(line) ? line.slice(1) : line));
  return body.join('\n').trim() + '\n';
}

export interface ReadmeImage {
  /** Path inside the checkout, e.g. `docs/assets/demo.gif`. */
  file: string;
  alt: string;
}

/** Every README image under `docs/assets/`, with the alt text the README maintains for it. */
export function readmeImages(readme: string): ReadmeImage[] {
  return [...readme.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)]
    .filter(([, , src]) => src!.startsWith('docs/assets/'))
    .map(([, alt, src]) => ({ file: src!, alt: alt! }));
}

export interface GalleryEntry extends ReadmeImage {
  /** The bold name the README gives the panel, e.g. `Routing`. */
  title: string;
  /** The key that opens it, when the README names one. */
  key?: string;
  /** The README's one-line account of the panel, as markdown. */
  blurb: string;
}

/**
 * The `<details>` block of panel screenshots under "Interactive dashboard":
 * `**Title** (`k`) — blurb`, a blank line, then the image. The captions the
 * gallery shows and the keys the hero's footer names both come from here, so
 * a screenshot the README stops describing cannot be shown unlabelled.
 */
export function readmeGallery(readme: string): GalleryEntry[] {
  const block = sliceSection(readme, 'Interactive dashboard').match(/<details>([\s\S]*?)<\/details>/);
  if (!block) throw new Error(`${TEXT.readme}'s "Interactive dashboard" has no <details> block of screenshots`);
  const entries: GalleryEntry[] = [];
  const pattern = /^\*\*([^*]+)\*\*(?: \(`(\w)`\))? — ([\s\S]*?)\n\n!\[([^\]]*)\]\(([^)\s]+)\)/gm;
  for (const [, title, key, blurb, alt, file] of block[1]!.matchAll(pattern)) {
    entries.push({ title: title!, key: key || undefined, blurb: blurb!.replace(/\s+/g, ' '), alt: alt!, file: file! });
  }
  const pngs = ASSETS.filter((a) => a.endsWith('.png'));
  if (entries.length < pngs.length) {
    throw new Error(`${TEXT.readme} describes ${entries.length} panel screenshots but ${pngs.length} are trusted`);
  }
  for (const entry of entries) {
    const assets: readonly string[] = ASSETS;
    if (!assets.includes(entry.file)) throw new Error(`${TEXT.readme} shows ${entry.file}, which is not a trusted asset`);
  }
  return entries;
}

export interface LinkContext {
  /** Astro `base`, without a trailing slash. */
  base: string;
  /** Release tag the checkout corresponds to; relative links land on GitHub at that tag. */
  tag: string;
  /** Path of the source file inside the checkout, e.g. `docs/routing-analytics.md`. */
  sourcePath: string;
  /** Heading ids present on the page this HTML will be shown on. */
  headingIds: Set<string>;
}

/** Public path of a copied asset: `base` then `/aiu/`, e.g. `/aiu/demo.gif`. */
export function assetUrl(base: string, file: string): string {
  return `${base}/${ASSET_DIR}/${file.replace(/^docs\/assets\//, '')}`;
}

/**
 * Rewrites `href` and `src` in rendered HTML so that a document written for
 * GitHub reads correctly here. Runs on HTML rather than markdown, and on tags
 * rather than the whole text, so that a link-shaped thing inside a code span
 * is left alone.
 */
export function rewriteLinks(html: string, ctx: LinkContext): string {
  const blob = `${REPO}/blob/${ctx.tag}/`;
  const assets: readonly string[] = ASSETS;
  const rewrite = (all: string, attr: string, url: string) => {
    if (url.startsWith(RAW_MAIN)) {
      const rel = url.slice(RAW_MAIN.length);
      return assets.includes(rel) ? `${attr}="${assetUrl(ctx.base, rel)}"` : all;
    }
    if (assets.includes(url)) return `${attr}="${assetUrl(ctx.base, url)}"`;
    if (url.startsWith('#')) {
      return ctx.headingIds.has(url.slice(1)) ? all : `${attr}="${blob}${ctx.sourcePath}${url}"`;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('/')) return all;
    return `${attr}="${new URL(url, `${blob}${ctx.sourcePath}`).href}"`;
  };
  // Only an attribute inside a tag is a link. A changelog entry that quotes
  // `src="tools/**"` in a code span is text, and stays as written.
  return html.replace(/<[a-z][^>]*>/gi, (tag) => tag.replace(/\b(href|src)="([^"]*)"/g, rewrite));
}

/* ---- The dashboard's palette ----------------------------------------------
 *
 * The site paints the hero in the dashboard's own colours. Those are a design
 * decision written as literals in `tokens.css`; this reader exists so that
 * `npm run check` can say when the dashboard has moved on from them.
 */

const hex = (n: number) => n.toString(16).padStart(2, '0');

/**
 * Every named colour the dashboard defines, lowercase hex by lowercase name:
 * `pub const CYAN: Color = Color::Rgb(69, 211, 255)` from the Rust modules, and
 * `Color::Cyan => "#45d3ff"` from the SVG renderer's table. A bare
 * `Color::Rgb(r, g, b)` with no name is skipped except the border, which the
 * theme module writes inline and the hero draws with.
 */
export function readTuiPalette(dir: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [name, file] of Object.entries(PALETTE_SOURCE)) {
    const rs = readFileSync(resolve(dir, file), 'utf8');
    for (const [, konst, r, g, b] of rs.matchAll(/const (\w+): Color = Color::Rgb\((\d+), (\d+), (\d+)\)/g)) {
      found[konst!.toLowerCase()] = `#${hex(Number(r))}${hex(Number(g))}${hex(Number(b))}`;
    }
    for (const [, variant, value] of rs.matchAll(/Color::(\w+) => "(#[0-9a-fA-F]{6})"/g)) {
      found[variant!.toLowerCase()] = value!.toLowerCase();
    }
    if (name === 'theme') {
      const border = rs.match(/border_style\([^;]*?Color::Rgb\((\d+), (\d+), (\d+)\)/);
      if (border) found.border = `#${hex(Number(border[1]))}${hex(Number(border[2]))}${hex(Number(border[3]))}`;
    }
  }
  for (const key of ['cyan', 'green', 'yellow', 'red', 'cloud', 'muted', 'panel', 'border', 'black', 'blue', 'magenta']) {
    if (!found[key]) throw new Error(`no ${key} colour found under ${Object.values(PALETTE_SOURCE).join(', ')}`);
  }
  return found;
}
