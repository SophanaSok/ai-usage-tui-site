// The site's own policing, run as `npm run check` after `npm run build`.
// Nothing here may pin a version, every trusted asset must reach the page,
// every internal link must resolve, and the hero may show only what it has
// registered.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  ASSETS,
  ASSET_DIR,
  OG,
  TEXT,
  assetSize,
  assetUrl,
  entryLede,
  plainText,
  readRelease,
  readReleases,
  readTuiPalette,
  readmeGallery,
  sliceSection,
  sourceDir,
  writtenOn,
} from '../src/lib/source.ts';
import { GUIDES, PAGES } from '../src/lib/pages.ts';
import { DEMO, FOOTER, isDemo } from '../src/lib/demo.ts';

const DIST = resolve('dist');
// Read from the config rather than written down, so that moving the site to a
// domain of its own is a change to `astro.config.mjs` and nothing else. Astro
// reports no `base` as `/`, which these tests want as the empty string.
const { default: config } = await import('../astro.config.mjs');
const BASE = (config.base ?? '/').replace(/\/$/, '');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const decode = (text) =>
  text.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);

test('no version literal in the site source', () => {
  const files = [...walk('src'), ...walk('tests'), 'README.md', 'CLAUDE.md', 'astro.config.mjs'];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const word of line.split(/[^0-9.]/)) {
        assert.ok(!/^\d+\.\d+\.\d+$/.test(word), `${file}:${i + 1} pins a version, ${word}: ${line.trim()}`);
      }
    });
  }
});

test('the checkout is complete and names a dated release', () => {
  const release = readRelease(sourceDir());
  assert.match(release.version, /^\d+\.\d+\.\d+$/);
  assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(release.description.length > 0);
});

test('every changelog entry opens with prose the feed can carry', () => {
  for (const note of readReleases(sourceDir())) {
    const lede = entryLede(note.body, note.tag);
    assert.ok(lede.length > 20, `${note.tag}: lede is ${JSON.stringify(lede)}`);
    assert.doesNotMatch(lede, /^[#|>-]/, `${note.tag}: lede opens with markup: ${lede.slice(0, 40)}`);
  }
});

test('the build ran', () => {
  assert.ok(existsSync(join(DIST, 'index.html')), 'dist/index.html missing: run `npm run build` first');
});

test('every trusted asset was copied and is shown on the home page', () => {
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  for (const asset of ASSETS) {
    const name = asset.replace(/^docs\/assets\//, '');
    assert.ok(existsSync(join(DIST, ASSET_DIR, name)), `dist/${ASSET_DIR}/${name} missing`);
    assert.ok(home.includes(assetUrl(BASE, asset)), `index.html does not show ${name}`);
  }
});

test('the home page install commands are the README’s', () => {
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const readme = readFileSync(join(sourceDir(), TEXT.readme), 'utf8');
  const script = 'scripts/install.sh | sh';
  assert.ok(home.includes(script), 'home page lacks the install script');
  assert.ok(sliceSection(readme, 'Quick start').includes(script), 'README quick start no longer pipes the script');
  const cargo = 'cargo install ai-usage-tui --locked';
  assert.ok(home.includes(cargo), 'home page lacks the cargo command');
  assert.ok(sliceSection(readme, 'Installation').includes(cargo), 'README install section no longer has the cargo command');
});

test('the site states the release the checkout describes', () => {
  const { tag, date } = readRelease(sourceDir());
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  assert.ok(home.includes(`>${tag}<`), `home page does not name ${tag}`);
  assert.ok(home.includes(date), `home page does not name ${date}`);
});

test('every internal link in dist resolves', () => {
  const pages = walk(DIST).filter((f) => f.endsWith('.html'));
  const ids = new Map(
    pages.map((p) => [p, new Set([...readFileSync(p, 'utf8').matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))]),
  );
  let checked = 0;
  for (const page of pages) {
    // Attributes inside tags: a code span that quotes `src="..."` is text.
    const html = readFileSync(page, 'utf8');
    const urls = [...html.matchAll(/<[a-z][^>]*>/gi)].flatMap((tag) =>
      [...tag[0].matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    );
    for (const url of urls) {
      if (/^(https?:|mailto:|data:)/.test(url)) continue;
      const [path, fragment] = url.split('#');
      let target = page;
      if (path) {
        assert.ok(path === BASE || path.startsWith(`${BASE}/`), `${page}: ${url} lacks the base prefix`);
        const rel = path.slice(BASE.length).replace(/^\//, '');
        const candidates = [join(DIST, rel), join(DIST, rel, 'index.html'), `${join(DIST, rel)}.html`];
        target = candidates.find((c) => existsSync(c) && statSync(c).isFile());
        assert.ok(target, `${page}: ${url} points at nothing in dist`);
      }
      if (fragment && target.endsWith('.html')) {
        assert.ok(ids.get(target)?.has(fragment), `${page}: ${url} names an anchor that is not on the page`);
      }
      checked += 1;
    }
  }
  assert.ok(checked > 20, `only ${checked} internal links found; the crawl is not seeing the site`);
});

/* ---- What the pages say about themselves -------------------------------- */

/** Every built page, and the path it is served at. */
function builtPages() {
  return walk(DIST)
    .filter((f) => f.endsWith('.html'))
    .map((file) => {
      const rel = file.slice(DIST.length + 1);
      const path = rel === '404.html' ? null : `${BASE}/${rel.replace(/(^|\/)index\.html$/, '$1')}`;
      return { file, rel, path, html: readFileSync(file, 'utf8') };
    });
}

const meta = (html, name) =>
  html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
const property = (html, name) =>
  html.match(new RegExp(`<meta property="${name}" content="([^"]*)"`))?.[1];

test('every indexed page describes itself, and no two the same', () => {
  const seen = new Map();
  for (const { rel, path, html } of builtPages()) {
    if (!path) {
      assert.equal(meta(html, 'description'), undefined, `${rel} is not indexed but still describes itself`);
      continue;
    }
    const description = meta(html, 'description');
    assert.ok(description, `${rel} has no meta description`);
    const text = decode(description);
    assert.ok(text.length >= 50 && text.length <= 160, `${rel}: description is ${text.length} characters: ${text}`);
    assert.ok(!seen.has(text), `${rel} and ${seen.get(text)} ship the same description`);
    seen.set(text, rel);
  }
  assert.ok(seen.size >= PAGES.length, `only ${seen.size} descriptions for ${PAGES.length} pages`);
});

test('every description is a trusted document’s own words', () => {
  // Both sides are flattened the same way, with one wrinkle: a description is
  // made from *rendered* HTML, where `<code>` has already escaped a span like
  // `<id>`, while the file it came from is markdown, where that span is still
  // inside backticks and stripping tags would eat it. So each file joins the
  // corpus twice, once flattened as markup and once not.
  const flatten = (md) => md.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`/g, '').replace(/\*\*/g, '');
  const corpus = Object.values(TEXT)
    .map((file) => readFileSync(join(sourceDir(), file), 'utf8'))
    .flatMap((md) => [plainText(flatten(md)), flatten(md).replace(/\s+/g, ' ')])
    .join('\n')
    .replace(/[“”]/g, '"')
    .replace(/’/g, "'")
    .replace(/–/g, '--');

  for (const { rel, path, html } of builtPages()) {
    if (!path) continue;
    // A clamped description closes the clause it stopped at, or trails off;
    // neither punctuation mark is the document's, so neither is checked.
    // The renderer curls quotes and turns a changelog's ` -- ` into an en dash; the corpus and
    // the stem are straightened the same way. The dash was missed until a release's first entry
    // had one, and the changelog page then described itself in words "no trusted file has".
    const stem = decode(meta(html, 'description')).replace(/[.…]$/, '').replace(/[“”]/g, '"').replace(/’/g, "'").replace(/–/g, '--');
    assert.ok(corpus.includes(stem), `${rel} describes itself with words no trusted file has: ${stem}`);
  }
});

test('every page title is its own', () => {
  const { name } = readRelease(sourceDir());
  const seen = new Map();
  for (const { rel, html } of builtPages()) {
    const title = decode(html.match(/<title>([^<]*)<\/title>/)[1]);
    assert.ok(title.includes(name), `${rel}: "${title}" does not name the crate`);
    assert.ok(title.length <= 90 || rel === 'index.html', `${rel}: title is ${title.length} characters`);
    assert.ok(!seen.has(title), `${rel} and ${seen.get(title)} ship the same title`);
    seen.set(title, rel);
  }
});

test('every indexed page points its canonical at itself, and only those do', () => {
  for (const { rel, path, html } of builtPages()) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!path) {
      assert.equal(canonical, undefined, `${rel} claims a URL it does not have`);
      assert.match(meta(html, 'robots') ?? '', /noindex/, `${rel} is reachable at no URL but is not noindex`);
      continue;
    }
    assert.ok(canonical, `${rel} has no canonical`);
    assert.equal(new URL(canonical).pathname, path, `${rel}: canonical points elsewhere`);
    assert.equal(meta(html, 'robots'), undefined, `${rel} is indexed but carries a robots directive`);
  }
});

/* ---- The agent guides ---------------------------------------------------- */

test('the agent guides are the ones the binary prints, and each can be reached', () => {
  // The reading guide is what the bare flag prints, and its closing section is
  // where the binary lists the other topics. That list is the app's, so the
  // site's table is held to it: a topic added upstream fails here until it has
  // a page, and a page for a topic the flag does not take is refused.
  const reading = readFileSync(join(sourceDir(), TEXT.guideRead), 'utf8');
  const named = new Set([...reading.matchAll(/`ai-usage-tui --agent-guide ([a-z]+)`/g)].map((m) => m[1]));
  assert.ok(named.size >= 3, `the reading guide names only ${[...named]}`);
  const served = new Set(GUIDES.map((g) => g.topic).filter((topic) => topic !== 'read'));
  assert.deepEqual([...served].sort(), [...named].sort(), 'GUIDES and the topics --agent-guide lists disagree');

  const agents = readFileSync(join(DIST, 'agents', 'index.html'), 'utf8');
  for (const guide of GUIDES) {
    const path = `agents/${guide.topic}/`;
    assert.ok(PAGES.some((p) => p.path === path), `${path} is not in PAGES, so not in the sitemap`);
    const file = join(DIST, 'agents', guide.topic, 'index.html');
    assert.ok(existsSync(file), `${path} was not built`);
    // Nothing else links to a guide, so the Agents page has to.
    assert.ok(agents.includes(`href="${BASE}/${path}"`), `the Agents page does not link to ${path}`);
    // The link's label is the command, and the page it goes to says the same
    // command prints it: the guide's own opening, not the site's claim.
    const html = decode(readFileSync(file, 'utf8'));
    assert.ok(agents.includes(`<code>${guide.command}</code>`), `no link labelled ${guide.command}`);
    assert.ok(html.includes(`ai-usage-tui ${guide.command}`), `${path} never names ${guide.command}`);
  }
});

/* ---- The hero ------------------------------------------------------------ */

/** The hero's markup, from its opening tag to the end of its footer. */
function heroHtml() {
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const found = home.match(/<div class="term" id="term"[\s\S]*?<\/footer>\s*<\/div>/);
  assert.ok(found, 'the home page has no hero');
  return { home, hero: found[0] };
}

test('the hero shows only what it has registered', () => {
  const { hero } = heroHtml();
  // Every text node, trimmed. Punctuation on its own — the slash between a
  // provider and a model, the arrow of an escalation — is not a string.
  const texts = [...hero.matchAll(/>([^<]+)</g)]
    .map((m) => decode(m[1]).trim())
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
  assert.ok(texts.length > 100, `only ${texts.length} strings in the hero; the match is not seeing it`);
  for (const text of texts) {
    assert.ok(isDemo(text), `the hero shows ${JSON.stringify(text)}, which lib/demo.ts does not register`);
  }
});

/**
 * A page's prose, with its code spans taken out. What a code span holds is the
 * source document's own words — the changelog's account of the dashboard
 * redesign quotes the very tiles the hero draws — and the site cannot put
 * anything in one that a trusted file does not say, because hand-typed
 * commands go through `quote()`. What the rule below forbids is the site
 * stating one of the pictures' figures as prose of its own.
 */
function prose(html) {
  return html.replace(/<code[^>]*>[\s\S]*?<\/code>/g, '');
}

test('the hero’s invented numbers appear nowhere else', () => {
  const { home, hero } = heroHtml();
  const rest = prose(home.replace(hero, ''));
  const pages = builtPages().filter((p) => p.rel !== 'index.html');
  // The figures that could only have come from the pictures: a dollar amount,
  // a decimal, a token count with its unit. A bare percentage or count is too
  // ordinary to police.
  for (const { text, from } of DEMO) {
    if (from !== 'invented' || !/\d/.test(text) || !/\$|\d\.\d|\d[MK]\b/.test(text)) continue;
    const needle = `>${text}<`;
    assert.ok(!rest.includes(needle), `${JSON.stringify(text)} is invented for the hero but appears elsewhere on the home page`);
    for (const { rel, html } of pages) {
      assert.ok(!prose(html).includes(needle), `${JSON.stringify(text)} is invented for the hero but appears on ${rel}`);
    }
  }
});

test('the hero’s panel keys are the README’s', () => {
  const keys = new Map(readmeGallery(readFileSync(join(sourceDir(), TEXT.readme), 'utf8')).map((g) => [g.key, g.title]));
  for (const entry of FOOTER) {
    if (!entry.panel) continue;
    assert.ok(keys.has(entry.key.text), `the hero's footer offers ${entry.key.text}, which the README names no panel for`);
  }
  for (const entry of FOOTER) {
    if (entry.pane) assert.ok(entry.panel, `${entry.key.text} opens a pane but is not marked as a README panel key`);
  }
});

test('the hero paints the dashboard’s own colours', () => {
  const palette = readTuiPalette(sourceDir());
  const tokens = readFileSync('src/styles/tokens.css', 'utf8');
  const token = (name) => tokens.match(new RegExp(`--tui-${name}:\\s*(#[0-9a-f]{6})`))?.[1];
  const pairs = {
    cyan: 'cyan', green: 'green', blue: 'blue', yellow: 'yellow', magenta: 'magenta', red: 'red',
    black: 'black', muted: 'muted', panel: 'panel', border: 'border', dim: 'darkgray',
  };
  for (const [name, from] of Object.entries(pairs)) {
    assert.equal(
      token(name), palette[from],
      `--tui-${name} is ${token(name)} but the dashboard draws ${from} as ${palette[from]}; update tokens.css`,
    );
  }
});

test('every image travels with the README’s caveat about it', () => {
  const readme = readFileSync(join(sourceDir(), TEXT.readme), 'utf8');
  assert.ok(readme.includes('No real account'), 'the README no longer carries its provenance caveat');
  for (const { rel, html } of builtPages()) {
    if (!html.includes(`/${ASSET_DIR}/`) || !html.includes('<img')) continue;
    assert.ok(html.includes('No real account'), `${rel} shows a screenshot without the README's caveat`);
  }
});

test('the gallery is the README’s own list of panels', () => {
  const gallery = readmeGallery(readFileSync(join(sourceDir(), TEXT.readme), 'utf8'));
  const pngs = ASSETS.filter((a) => a.endsWith('.png'));
  assert.equal(gallery.length, pngs.length);
  assert.deepEqual(gallery.map((g) => g.file).sort(), [...pngs].sort());
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  for (const entry of gallery) assert.ok(home.includes(`<b>${entry.title}</b>`), `home page does not caption ${entry.title}`);
});

/* ---- Structured data ----------------------------------------------------- */

test('the home page states the release in machine-readable form', () => {
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const found = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(found, 'no JSON-LD on the home page');
  assert.ok(!found[1].includes('</script'), 'the JSON-LD is not escaped against ending its own element');

  const { version, date, tag, description, author } = readRelease(sourceDir());
  const graph = JSON.parse(found[1])['@graph'];
  const app = graph.find((node) => String(node['@type']).includes('SoftwareApplication'));
  assert.ok(app, 'the graph names no SoftwareApplication');
  assert.equal(app.softwareVersion, version);
  assert.equal(app.datePublished, date);
  assert.equal(app.description, description);
  assert.ok(app.releaseNotes.endsWith(tag), `releaseNotes does not name ${tag}`);

  const person = graph.find((node) => node['@type'] === 'Person');
  assert.equal(person.name, author);
  // The manifest spells the author with an address. It must not travel.
  assert.doesNotMatch(JSON.stringify(graph), /[\w.-]+@[\w.-]+\.\w+/, 'an address reached the page');
});

test('a page that is not indexed states nothing about itself', () => {
  const notFound = readFileSync(join(DIST, '404.html'), 'utf8');
  assert.ok(!notFound.includes('ld+json'), 'the 404 page ships structured data');
});

/* ---- The files a crawler asks for ---------------------------------------- */

test('the sitemap lists every page, and only pages', () => {
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).sort();
  const built = builtPages().map((p) => p.path).filter(Boolean).sort();
  assert.deepEqual(listed, built, 'the sitemap and the built pages disagree');
  assert.ok(!xml.includes('/404'), 'the sitemap lists the 404 page');
  const { date } = readRelease(sourceDir());
  for (const [, lastmod] of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) assert.equal(lastmod, date);
});

test('robots.txt names a sitemap that is there', () => {
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  const sitemap = robots.match(/^Sitemap: (\S+)$/m);
  assert.ok(sitemap, 'robots.txt names no sitemap');
  assert.equal(new URL(sitemap[1]).pathname, `${BASE}/sitemap.xml`);
  assert.ok(existsSync(join(DIST, 'sitemap.xml')));
});

test('the feed carries every release the changelog dates, and the write-up', () => {
  const xml = readFileSync(join(DIST, 'changelog.xml'), 'utf8');
  const changelog = readFileSync(join(sourceDir(), TEXT.changelog), 'utf8');
  const dated = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/gm)].length;
  const items = [...xml.matchAll(/<item>/g)].length;
  assert.equal(items, dated + 1, `the feed has ${items} items for ${dated} dated releases and one write-up`);
  assert.ok(!xml.includes(']]>'), 'the feed contains a sequence that would end a CDATA section');
  assert.match(xml, new RegExp(`<link>[^<]*${BASE}/changelog/`), 'the feed does not link back to the site');
  assert.match(xml, new RegExp(`<link>[^<]*${BASE}/what-a-max-subscription-bought/</link>`), 'the feed does not carry the write-up');
  // Newest first, as a reader expects and as the sort promises.
  const dates = [...xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) => Date.parse(m[1]));
  for (let i = 1; i < dates.length; i += 1) assert.ok(dates[i - 1] >= dates[i], 'the feed is not newest first');
});

test('the write-up is dated by its own opening line, and the rest by the release', () => {
  const dir = sourceDir();
  const written = writtenOn(readFileSync(join(dir, TEXT.measurement), 'utf8'), TEXT.measurement);
  assert.match(written, /^\d{4}-\d{2}-\d{2}$/);
  const graph = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const post = readFileSync(join(DIST, 'what-a-max-subscription-bought', 'index.html'), 'utf8');
  assert.equal(property(post, 'article:published_time'), written);
  assert.equal(graph(post).find((n) => n['@type'] === 'TechArticle').datePublished, written);
  const { date: released } = readRelease(dir);
  const changelog = readFileSync(join(DIST, 'changelog', 'index.html'), 'utf8');
  assert.equal(property(changelog, 'article:published_time'), released);
  assert.equal(graph(changelog).find((n) => n['@type'] === 'TechArticle').datePublished, released);
  const xml = readFileSync(join(DIST, 'changelog.xml'), 'utf8');
  const stamp = new Date(`${written}T00:00:00Z`).toUTCString();
  assert.ok(xml.includes(`<pubDate>${stamp}</pubDate>`), 'the feed item does not carry the write-up’s own date');
});

/* ---- The social card ----------------------------------------------------- */

test('the social card is generated at the size the pages claim', () => {
  const dir = join(DIST, ASSET_DIR);
  assert.ok(existsSync(join(dir, OG.file)), `dist/${ASSET_DIR}/${OG.file} missing`);
  assert.deepEqual(assetSize(dir, OG.file), { width: OG.width, height: OG.height });
  const assets = ASSETS;
  assert.ok(assets.includes(OG.from), `${OG.from} is not a trusted asset`);
});

test('every page offers the social card, and none the demo GIF', () => {
  for (const { rel, html } of builtPages()) {
    const image = property(html, 'og:image');
    assert.ok(image, `${rel} has no og:image`);
    assert.ok(image.endsWith(assetUrl(BASE, OG.file)), `${rel} points at ${image}`);
    assert.ok(!image.endsWith('.gif'), `${rel} still uses the demo GIF as its social image`);
    assert.equal(property(html, 'og:image:width'), String(OG.width));
    assert.equal(property(html, 'og:image:height'), String(OG.height));
    assert.ok(property(html, 'og:image:alt'), `${rel} does not describe its social image`);
  }
});

/* ---- What the pages must never ship ------------------------------------- */

test('no page ships a script it did not write, a handler, or an unsafe URL', () => {
  for (const { rel, html } of builtPages()) {
    const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map((m) => m[0]);
    // Every script is the site's own: the JSON-LD data block, and the ones
    // Astro bundled from the layout and the home page, served from here.
    for (const tag of tags.filter((t) => /^<script\b/i.test(t))) {
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (src) assert.ok(src.startsWith(`${BASE}/`), `${rel} loads a script from ${src}`);
    }
    assert.doesNotMatch(html, /<(iframe|object|embed|form)\b/i, `${rel} embeds a document or a form`);
    for (const tag of tags) {
      assert.doesNotMatch(tag, /\son[a-z]+=/i, `${rel} has an inline event handler: ${tag}`);
      assert.doesNotMatch(tag, /\b(href|src|action)="\s*(javascript|data|vbscript):/i, `${rel} has a script-scheme URL: ${tag}`);
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (src) assert.ok(src.startsWith(`${BASE}/`), `${rel} loads ${src} from outside the site`);
      const href = tag.match(/\bhref="([^"]+)"/)?.[1];
      if (href) assert.ok(/^(https:|#|\/)/.test(href), `${rel} links to ${href}, which is not https or local`);
    }
    // And the policy that holds the browser to the same: a CSP on every page.
    const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1];
    assert.ok(csp, `${rel} carries no content security policy`);
    assert.match(csp, /script-src 'self' 'sha\d+-/, `${rel}: the policy does not hash its scripts`);
    assert.doesNotMatch(csp, /script-src[^;]*unsafe/, `${rel}: the script policy allows unsafe sources`);
    assert.match(csp, /default-src 'self'/, `${rel}: the policy has no default-src`);
  }
});
