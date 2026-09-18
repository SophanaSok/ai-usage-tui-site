# ai-usage-tui-site

The website for `ai-usage-tui`, a Rust terminal dashboard for AI coding
costs. This repository holds no facts about the product. It reads them, at
build time, from the app repository.

## Source of truth

- The product source is the checkout at `../ai-usage-tui` (`~/Projects/ai-usage-tui`,
  `github.com/SophanaSok/ai-usage-tui`). `AIU_SRC` overrides the path.
- The trusted files are exactly those listed in `src/lib/source.ts`
  (`Cargo.toml` for the description, `CHANGELOG.md`, `README.md`,
  `docs/routing-analytics.md`, `docs/what-a-max-subscription-bought.md`, the
  four guides `--agent-guide` prints (`docs/agent-guide.md`, `agent-setup.md`,
  `agent-recipes.md`, `agent-extend.md`), the
  demo GIF and the eight panel screenshots
  under `docs/assets/`), plus two scripts trusted for one purpose: the hero's
  invented names are checked against `scripts/make-demo-fixture.py` and
  `scripts/render-readme-screenshots.sh`, which is where the screenshots got
  them. To use another file, add it there so the build gate covers it.
- `PALETTE_SOURCE` names the Rust modules the dashboard's colours live in.
  They are read by `npm run check` only, to hold `tokens.css` to them.
- **Never edit, run git in, symlink, or vendor that tree from here.** It is
  read only. To build against a released tag, clone it into the scratchpad and
  point `AIU_SRC` at the clone.

## Rules

- **No invented claims.** Every sentence describing the product is rendered
  from a trusted file or quotes one verbatim through `quote()`. Hand-written
  text is limited to navigation, section labels, the footer, and the
  schema.org vocabulary in the JSON-LD graph, which is taxonomy rather than a
  statement about the product.
- **The hero is an illustration.** `src/components/Term.astro` draws the
  dashboard in HTML from the same invented demo data as the README
  screenshots. Every string it shows is registered in `src/lib/demo.ts` with
  where it came from: `readme` and the two scripts are checked verbatim at
  build; `invented` strings — numerals and panel titles that exist only in
  the rendered pictures — may appear nowhere else on the site as its own
  prose, though a trusted document may quote one in a code span, as the
  changelog's account of the dashboard's redesign does. The caption under the
  figure is the README's own caveat about its images. `npm run check` holds
  the built hero to that registry.
- A page's **meta description** is a paragraph of the document that page
  renders, picked by an anchor declared in `DOCS` and checked through
  `quote()`. The README wraps at eighty columns, so an anchor must sit inside
  one line of it.
- **No version literals** in `src/`, `tests/`, `README.md`, or this file. The
  version and date come from the changelog's newest dated heading. A page
  that renders a dated piece takes its date from the `*Written YYYY-MM-DD`
  line the piece opens with, through `writtenOn()`.
- Relative links inside rendered docs go to GitHub at the release tag.
- Astro, no integrations, no UI framework, dark only. What JavaScript there
  is lives in two `<script>` blocks Astro processes, so the content security
  policy it emits carries their hashes, and every feature they add degrades
  to working HTML without them: the hero's footer keys switch panes with CSS
  radios; the script adds the count-up, the cycle and the clock. Nothing is
  loaded from outside the site: no fonts, no analytics, no CDN.
- `src/lib/source.ts`, `src/lib/pages.ts` and `src/lib/demo.ts` must stay
  erasable TypeScript — types, `interface` and `as const` only — because
  `tests/site.test.mjs` imports them under Node's type stripping.
  `src/lib/og.ts` is separate precisely so the native image module never
  follows them into a test.
- The social card is cut from a trusted screenshot at build time into
  `public/aiu/`, which is generated and ignored, so no image is committed.
- Nothing binary under `src/`, and hand-author inline SVG on an integer grid.

## Commands

```sh
npm run dev       # against ../ai-usage-tui, at http://localhost:4321/ai-usage-tui-site/
npm run build
npm run check     # node --test tests/, needs a build first
npm run verify    # build then check, what CI runs
```

CI (`.github/workflows/pages.yml`) checks out the app at its latest GitHub
release, builds, checks, and deploys to GitHub Pages on push, daily, and on
manual dispatch.
