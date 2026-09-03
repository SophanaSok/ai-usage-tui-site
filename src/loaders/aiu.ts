// Astro content-layer loaders that read the ai-usage-tui checkout.
// They run at the start of `astro dev` and `astro build`, so one code path
// serves both, and a checkout that is missing anything fails the build here.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Loader } from 'astro/loaders';
import { z } from 'astro:content';
import { renderCard } from '../lib/og';
import {
  ASSETS,
  ASSET_DIR,
  OG,
  TEXT,
  clamp,
  entryLede,
  ledeParagraph,
  plainText,
  quote,
  readRelease,
  readReleases,
  readmeGallery,
  readmeImages,
  rewriteLinks,
  sliceSection,
  sourceDir,
  writtenOn,
  type SliceOptions,
} from '../lib/source';

/** One entry, `current`: the release the checkout describes, plus the README's image captions. */
export function releaseLoader(): Loader {
  return {
    name: 'aiu-release',
    schema: z.object({
      name: z.string(),
      version: z.string(),
      date: z.string(),
      tag: z.string(),
      description: z.string(),
      repository: z.string().url(),
      homepage: z.string().url(),
      license: z.string(),
      author: z.string(),
      keywords: z.array(z.string()),
      categories: z.array(z.string()),
      rustVersion: z.string(),
      notes: z.string(),
      /** The README's own opening paragraph, for the home page's description. */
      lede: z.string(),
      /** What the README calls the product, for the subpage titles. */
      kind: z.string(),
      /** The README's own platform sentence, for the structured data. */
      platforms: z.string(),
      /** The README's own sentence about its images, shown wherever one is. */
      provenance: z.string(),
      /** Every dated release, newest first, for the feed. */
      feed: z.array(
        z.object({ version: z.string(), tag: z.string(), date: z.string(), summary: z.string() }),
      ),
      images: z.array(z.object({ file: z.string(), alt: z.string() })),
      gallery: z.array(
        z.object({
          file: z.string(),
          alt: z.string(),
          title: z.string(),
          key: z.string().optional(),
          blurb: z.string(),
        }),
      ),
    }),
    async load({ store, logger, config, parseData, renderMarkdown }) {
      const dir = sourceDir();
      const release = readRelease(dir);
      const out = new URL(`${ASSET_DIR}/`, config.publicDir);
      mkdirSync(out, { recursive: true });
      for (const asset of ASSETS) copyFileSync(resolve(dir, asset), new URL(basename(asset), out));
      writeFileSync(new URL(OG.file, out), await renderCard(dir));
      const readme = readFileSync(resolve(dir, TEXT.readme), 'utf8');
      const images = readmeImages(readme);
      const intro = ledeParagraph(readme, 'Most usage tools answer', TEXT.readme);
      const lede = clamp(plainText((await renderMarkdown(intro)).html));
      const kind = quote(readme, 'Terminal dashboard', TEXT.readme);
      const platforms = quote(readme, 'Linux and macOS (x86_64 and aarch64) and Windows x86_64', TEXT.readme);
      // The README's own caveat under its images, whole: it wraps across lines
      // in the source, so it is taken as a paragraph rather than quoted.
      const provenance = plainText((await renderMarkdown(ledeParagraph(readme, '*Invented demo data', TEXT.readme))).html);
      // The blurbs are markdown; the gallery shows them as text.
      const gallery = [];
      for (const entry of readmeGallery(readme)) {
        gallery.push({ ...entry, blurb: plainText((await renderMarkdown(entry.blurb)).html) });
      }
      // Summarised here rather than in the endpoint: this is where the one
      // markdown renderer the site is allowed to have is in scope.
      const feed = [];
      for (const note of readReleases(dir)) {
        const opening = entryLede(note.body, `${TEXT.changelog}'s ${note.tag} entry`);
        const summary = clamp(plainText((await renderMarkdown(opening)).html), 300);
        feed.push({ version: note.version, tag: note.tag, date: note.date, summary });
      }
      store.clear();
      const data = await parseData({
        id: 'current',
        data: { ...release, images, gallery, lede, kind, platforms, provenance, feed },
      });
      store.set({ id: 'current', data });
      logger.info(`ai-usage-tui ${release.tag} from ${dir}, card ${OG.width}x${OG.height} from ${OG.from}`);
    },
  };
}

interface Doc {
  id: string;
  title: string;
  file: (typeof TEXT)[keyof typeof TEXT];
  slice?: { heading: string } & SliceOptions;
  /**
   * Opening words of the paragraph this page describes itself with, verbatim
   * in `file`. Declared rather than taken positionally because the paragraph
   * a document opens with is often a code block or a note to its maintainer.
   * A page with no anchor is described by the release's changelog notes.
   */
  lede?: string;
  /**
   * Paint the five category names in the dashboard's class colours wherever
   * the document sets one in a code span. A class on a `<code>`, not a word
   * the site adds.
   */
  chips?: boolean;
  /**
   * The document opens with a `*Written YYYY-MM-DD` line and the page dates
   * itself by it, rather than by the release the checkout is at.
   */
  dated?: boolean;
}

const DOCS: Doc[] = [
  { id: 'quickstart', title: 'Quick start', file: TEXT.readme, slice: { heading: 'Quick start', keepHeading: true, promote: true }, lede: 'Re-run it to upgrade' },
  { id: 'install', title: 'Install', file: TEXT.readme, slice: { heading: 'Installation', keepHeading: true, promote: true }, lede: 'Download the archive for your platform' },
  { id: 'sources', title: 'Data sources', file: TEXT.readme, slice: { heading: 'Data sources', keepHeading: true, promote: true }, lede: 'Every source is a file on this machine' },
  { id: 'cursor', title: 'Why there is no Cursor collector', file: TEXT.readme, slice: { heading: 'Why there is no Cursor collector' }, lede: 'Cursor is the agent most often asked about here' },
  // The screenshots are shown by the page itself, with the captions the
  // README gives them, so the block that holds them is cut here.
  { id: 'dashboard', title: 'Dashboard', file: TEXT.readme, slice: { heading: 'Interactive dashboard', keepHeading: true, promote: true, until: '<details>' }, lede: 'The main view combines summary metrics' },
  { id: 'limits', title: 'Subscription limits', file: TEXT.readme, slice: { heading: 'Interactive dashboard', from: '### Subscription limits', keepHeading: true, promote: true }, lede: 'The `l` panel shows each subscription' },
  { id: 'output', title: 'Non-interactive output', file: TEXT.readme, slice: { heading: 'Non-interactive output', keepHeading: true, promote: true }, lede: '`--json` and `--csv` imply `--once`' },
  { id: 'config', title: 'Configuration', file: TEXT.readme, slice: { heading: 'Configuration', keepHeading: true, promote: true }, lede: 'The optional TOML file defaults to' },
  { id: 'budgets', title: 'Budget checks', file: TEXT.readme, slice: { heading: 'Budget checks', keepHeading: true, promote: true }, lede: 'Configured budgets appear in the TUI' },
  { id: 'cli', title: 'CLI reference', file: TEXT.readme, slice: { heading: 'CLI reference', keepHeading: true, promote: true } },
  { id: 'routing', title: 'Model-routing analytics', file: TEXT.readme, slice: { heading: 'Model-routing analytics', keepHeading: true, promote: true }, lede: 'This answers a question a usage total cannot' },
  // The section's opening argument, for the home page, without the panel
  // description that the screenshot beside it already shows.
  { id: 'routing-lede', title: 'Model-routing analytics', file: TEXT.readme, slice: { heading: 'Model-routing analytics', until: 'The panel also shows' }, lede: 'This answers a question a usage total cannot' },
  { id: 'routing-doc', title: 'Routing analytics', file: TEXT.routing, lede: 'Routing analytics answer a question' },
  { id: 'privacy', title: 'Privacy and network behavior', file: TEXT.readme, slice: { heading: 'Privacy and network behavior', keepHeading: true, promote: true }, lede: 'Normal dashboard and export operation does not require' },
  // The same list without its heading, and without the table of storage paths
  // that follows it, for the home page's ledger.
  { id: 'promise', title: 'Privacy and network behavior', file: TEXT.readme, slice: { heading: 'Privacy and network behavior', until: 'Default local storage paths' }, lede: 'Normal dashboard and export operation does not require' },
  { id: 'features', title: 'What it shows', file: TEXT.readme, slice: { heading: 'What it shows', until: 'Unknown cost is kept unknown' }, lede: 'Unknown cost is kept unknown' },
  { id: 'classes', title: 'Categories', file: TEXT.readme, slice: { heading: 'What it shows', from: '| Category | Meaning |' }, lede: '`PAID` is about who bills', chips: true },
  { id: 'changelog', title: 'Changelog', file: TEXT.changelog },
  // The launch write-up, whole. Its lede is the one sentence that puts the
  // two sides of the measurement next to each other.
  { id: 'measurement', title: 'What a Max subscription bought', file: TEXT.measurement, lede: 'That is a ratio a reader can form an opinion about', dated: true },
];

/** The documents the pages render, each with `rendered` so `render(entry)` works. */
export function docsLoader(): Loader {
  return {
    name: 'aiu-docs',
    schema: z.object({ title: z.string(), source: z.string(), description: z.string(), date: z.string().optional() }),
    async load({ store, renderMarkdown, watcher, config }) {
      const dir = sourceDir();
      const { tag, notes } = readRelease(dir);
      const base = config.base.replace(/\/$/, '');
      store.clear();
      for (const doc of DOCS) {
        const path = resolve(dir, doc.file);
        watcher?.add(path);
        const whole = readFileSync(path, 'utf8');
        let md = whole;
        if (doc.slice) md = sliceSection(md, doc.slice.heading, doc.slice);
        const rendered = await renderMarkdown(md, { fileURL: pathToFileURL(path) });
        const headingIds = new Set((rendered.metadata?.headings ?? []).map((h) => h.slug));
        rendered.html = rewriteLinks(rendered.html, { base, tag, sourcePath: doc.file, headingIds });
        if (doc.chips) {
          rendered.html = rendered.html.replace(
            /<code>(LOCAL|CLOUD|FREE|PAID|UNKNOWN)<\/code>/g,
            (_, name: string) => `<code class="cls cls-${name.toLowerCase()}">${name}</code>`,
          );
        }
        // Rendered first, then flattened: the renderer is what escapes a code
        // span, and it is the only markdown parser the site is allowed to have.
        const lede = doc.lede ? ledeParagraph(whole, doc.lede, doc.file) : notes;
        const description = clamp(plainText((await renderMarkdown(lede)).html));
        const date = doc.dated ? writtenOn(whole, doc.file) : undefined;
        store.set({ id: doc.id, data: { title: doc.title, source: doc.file, description, date }, body: md, rendered });
      }
    },
  };
}
