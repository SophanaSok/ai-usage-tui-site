// Every string the animated hero shows, and where each one came from.
//
// The hero is an illustration: a dashboard drawn in HTML from the same
// invented demo data as the README screenshots. It states nothing, but it
// shows a great deal, so each string is registered here with its provenance.
// `readme` strings are labels the README uses verbatim, `fixture` and
// `renderer` strings are the invented names the screenshot scripts define,
// and `invented` strings are the numerals and panel titles that exist only in
// the rendered pictures. `checkDemo()` holds the first three to their files at
// build time; `tests/site.test.mjs` holds the built hero to this list, and
// keeps the `invented` ones out of every other part of the site.
//
// Erasable TypeScript only, like `source.ts`: the tests import it.

export type Provenance = 'readme' | 'fixture' | 'renderer' | 'invented';

export interface DemoString {
  text: string;
  from: Provenance;
}

export const DEMO: DemoString[] = [];

function s(text: string, from: Provenance): DemoString {
  const entry = { text, from };
  DEMO.push(entry);
  return entry;
}

const R: Provenance = 'readme';
const F: Provenance = 'fixture';
const N: Provenance = 'renderer';
const I: Provenance = 'invented';

/** The panes the hero draws, and so the tabs and keys that can be active. */
export type Pane = 'models' | 'routing' | 'limits' | 'burn';

/** The five categories, as the README's table spells them. */
export const CLASSES = {
  local: s('LOCAL', R),
  cloud: s('CLOUD', R),
  free: s('FREE', R),
  paid: s('PAID', R),
  unknown: s('UNKNOWN', R),
} as const;

export type ClassName = keyof typeof CLASSES;

export const HEADER = {
  badge: s('AI USAGE', I),
  status: [s('all priced · 80 on quota', I), s('claude weekly 63%', I), s('ALL TIME', I)],
  clock: s('14:07:22', I),
};

/**
 * The words that name a panel, registered once and shown twice: the tab row
 * spells them out and the key line names the key that opens each.
 */
const WORDS = {
  models: s('models', R),
  budgets: s('budgets', R),
  routing: s('routing', R),
  projects: s('projects', R),
  graph: s('graph', I),
  burn: s('burn', R),
  sessions: s('sessions', R),
  limits: s('limits', R),
} as const;

export interface Tab {
  word: DemoString;
  /** The pane this tab shows, for the four the hero draws. */
  pane?: Pane;
}

/** The dashboard's tab row, in its order. */
export const TABS: Tab[] = [
  { word: WORDS.models, pane: 'models' },
  { word: WORDS.budgets },
  { word: WORDS.routing, pane: 'routing' },
  { word: WORDS.projects },
  { word: WORDS.graph },
  { word: WORDS.burn, pane: 'burn' },
  { word: WORDS.sessions },
  { word: WORDS.limits, pane: 'limits' },
];

/** The budget the demo data has already blown, as the header reports it. */
export const ALERT = {
  chip: s('EXCEEDED', I),
  text: s('model:claude-opus-5 monthly/$6.02/$6.00 (100%)', I),
};

/** The paid total, shown twice: on the tile and under the token flow. */
const paidCost = s('$9.7277', I);

export interface Tile {
  cls: 'total' | ClassName;
  title: DemoString;
  value: DemoString;
  /** The number the value counts up to, and the unit it is shown with. */
  count: number;
  unit: string;
  sub: DemoString;
}

export const TILES: Tile[] = [
  { cls: 'total', title: s('TOTAL TOKENS', I), value: s('15.7M', I), count: 15.7, unit: 'M', sub: s('450 requests', I) },
  { cls: 'local', title: CLASSES.local, value: s('3.3M', I), count: 3.3, unit: 'M', sub: s('21% · 77 req', I) },
  { cls: 'free', title: CLASSES.free, value: s('3.4M', I), count: 3.4, unit: 'M', sub: s('22% · 76 req', I) },
  { cls: 'paid', title: CLASSES.paid, value: s('5.5M', I), count: 5.5, unit: 'M', sub: paidCost },
  { cls: 'cloud', title: CLASSES.cloud, value: s('3.5M', I), count: 3.5, unit: 'M', sub: s('22% · 80 req', I) },
  { cls: 'unknown', title: CLASSES.unknown, value: s('0', I), count: 0, unit: '', sub: s('—', I) },
];

export interface Segment {
  cls: ClassName;
  label: DemoString;
  pct: DemoString;
  /** The share itself, for the width of the segment. */
  width: number;
}

/** The bar under the tiles: what each class spent of the whole. */
export const SHARE: Segment[] = [
  { cls: 'local', label: CLASSES.local, pct: s('21%', I), width: 21 },
  { cls: 'free', label: CLASSES.free, pct: s('22%', I), width: 22 },
  { cls: 'paid', label: CLASSES.paid, pct: s('35%', I), width: 35 },
  { cls: 'cloud', label: CLASSES.cloud, pct: s('22%', I), width: 22 },
];

export const FLOW = {
  title: s('TOKEN FLOW', I),
  rows: [
    [s('INPUT', I), s('5.8M', I)],
    [s('OUTPUT', I), s('1.3M', I)],
    [s('REASONING', I), s('162.9K', I)],
    [s('CACHE READ', I), s('7.7M', I)],
    [s('CACHE WRITE', I), s('798.0K', I)],
  ],
  cost: [s('EST. PAID COST', I), paidCost],
  status: [s('PRICING', I), s('complete · 80 on quota', I)],
};

/** The panel title the left column's gauges and the full pane share. */
const limitsTitle = s('LIMITS', I);

const pct42 = s('42%', I);
const pct63 = s('63%', I);

/**
 * The gauges in the left column, under the token flow. The terminal truncates
 * the second window to fit its column; the hero keeps the whole string and
 * lets CSS do the truncating, so nothing invented is registered half-said.
 */
export const MINI_LIMITS = {
  title: limitsTitle,
  rows: [
    { window: s('claude session (5-hour)', I), pct: 42, used: pct42 },
    { window: s('claude weekly (all models)', I), pct: 63, used: pct63 },
  ],
};

/**
 * The sparkline in the left column: nine days as a share of the peak, drawn
 * right-aligned the way the terminal draws them. The picture's footer line
 * carries the render's own date, so the hero leaves it off rather than
 * registering a date that goes quietly stale.
 */
export const SPARK = {
  title: s('TOKENS PER DAY', I),
  days: [67, 49, 45, 57, 36, 48, 66, 53, 99],
};

export interface ModelRow {
  provider: DemoString;
  model: DemoString;
  cls: ClassName;
  tokens: DemoString;
  /** What the cost column shows: a figure, or the class word when there is none. */
  cost: DemoString;
  /** `est` beside a calculated figure. */
  note?: DemoString;
  reqs: DemoString;
}

const est = s('est', I);
const onQuota = s('ON QUOTA', I);

export const MODELS = {
  title: s('MODEL ACTIVITY', I),
  count: s('9 models', I),
  head: [s('PROVIDER / MODEL', I), s('CLASS', I), s('TOKENS', I), s('COST', I), s('REQS', I)],
  rows: [
    { provider: s('anthropic', R), model: s('claude-opus-5', F), cls: 'paid', tokens: s('2.5M', I), cost: s('$6.0239', I), note: est, reqs: s('102', I) },
    { provider: s('anthropic', R), model: s('claude-sonnet-5', F), cls: 'paid', tokens: s('2.3M', I), cost: s('$3.3720', I), note: est, reqs: s('88', I) },
    { provider: s('opencode', F), model: s('lantern-flash-free', F), cls: 'free', tokens: s('2.0M', I), cost: CLASSES.free, reqs: s('43', I) },
    { provider: s('ollama-cloud', F), model: s('orbit-reasoner:cloud', F), cls: 'cloud', tokens: s('1.9M', I), cost: onQuota, reqs: s('43', I) },
    { provider: s('ollama', F), model: s('beacon-small-8b', F), cls: 'local', tokens: s('1.6M', I), cost: CLASSES.local, reqs: s('40', I) },
    { provider: s('ollama', F), model: s('orbit-coder-14b', F), cls: 'local', tokens: s('1.6M', I), cost: CLASSES.local, reqs: s('37', I) },
    { provider: s('ollama-cloud', F), model: s('lantern-max', F), cls: 'cloud', tokens: s('1.6M', I), cost: onQuota, reqs: s('37', I) },
    { provider: s('opencode', F), model: s('beacon-mini-free', F), cls: 'free', tokens: s('1.4M', I), cost: CLASSES.free, reqs: s('33', I) },
    { provider: s('anthropic', R), model: s('claude-haiku-4-5', F), cls: 'paid', tokens: s('688.6K', I), cost: s('$0.3317', I), note: est, reqs: s('27', I) },
  ] as ModelRow[],
};

export const ROUTING = {
  escalations: {
    title: s('ESCALATIONS — derived from sessions', I),
    share: s('28%', I),
    sentence: s('of 18 sessions used a pricier model than they opened with', I),
    rows: [
      { from: s('claude-haiku-4-5', F), to: s('claude-opus-5', F), count: s('4 sessions', I), after: s('$1.40 after', I) },
      { from: s('claude-sonnet-5', F), to: s('claude-opus-5', F), count: s('1 session', I), after: s('$0.41 after', I) },
    ],
  },
  title: s('ROUTING — cost per delivered result', I),
  head: [s('AGENT', I), s('MODEL', I), s('$/SUCCESS', I), s('PASS', I), s('RETRY', I), s('ESC', I), s('DEFECT', I), s('TOKENS', I), s('TASKS', I)],
  rows: [
    { agent: s('drafter', N), model: s('claude-haiku-4-5', F), cost: s('$0.0700', I), cells: [s('50%', I), s('50%', I), s('50%', I), s('50%', I), s('57.0K', I), s('2', I)], pass: 'warn' },
    { agent: s('reviewer', N), model: s('claude-sonnet-5', F), cost: s('$0.2200', I), cells: [s('100%', I), s('0%', I), s('0%', I), s('0%', I), s('74.0K', I), s('1', I)], pass: 'ok' },
    { agent: s('implementer', N), model: s('claude-opus-5', F), cost: s('$0.6000', I), cells: [s('100%', I), s('50%', I), s('0%', I), s('50%', I), s('240.0K', I), s('2', I)], pass: 'ok' },
  ],
};

export const LIMITS = {
  title: limitsTitle,
  head: [s('AGENT', I), s('WINDOW', I), s('USED', I), s('RESETS IN', I), s('AT', I), s('TIER', I)],
  rows: [
    { agent: s('claude', F), window: s('Session (5-hour)', I), pct: 42, used: pct42, resets: s('2h 08m', I), at: s('Fri 13:35', I) },
    { agent: s('claude', F), window: s('Weekly (all models)', I), pct: 63, used: pct63, resets: s('3d 3h', I), at: s('Mon 15:25', I) },
  ],
  foot: s('Claude Code · updated <1m ago', I),
};

export interface Budget {
  scope: DemoString;
  /** How long the budget lasts at this rate, or that it is already blown. */
  left: DemoString;
  remaining?: DemoString;
  /** The budget is spent; the hero says so in red. */
  over?: boolean;
}

export const BURN = {
  title: s('BURN RATE', I),
  window: s('(last 1h)', I),
  rows: [
    [s('tokens/min', I), s('13.2K', I)],
    [s('requests', I), s('20', I)],
    [s('spend', I), s('$0.99/hr', I)],
  ],
  budgets: [
    { scope: s('global monthly', I), left: s('15h 29m left', I), remaining: s('($15.27 remaining)', I) },
    { scope: s('provider:anthropic monthly', I), left: s('10h 25m left', I), remaining: s('($10.27 remaining)', I) },
    { scope: s('model:claude-opus-5 monthly', I), left: s('already over', I), over: true },
  ] as Budget[],
};

export interface FooterKey {
  key: DemoString;
  word: DemoString;
  /** The pane this key opens in the hero, for the ones the hero draws. */
  pane?: 'routing' | 'limits' | 'burn';
  /** The README names this key as a panel key; the tests check it does. */
  panel?: boolean;
}

/** The dashboard's own key line, in its order. */
export const FOOTER: FooterKey[] = [
  { key: s('1-4', I), word: s('range', R) },
  { key: s('r', R), word: s('refresh', R) },
  { key: s('b', R), word: WORDS.budgets, panel: true },
  { key: s('t', R), word: WORDS.routing, panel: true, pane: 'routing' },
  { key: s('p', R), word: WORDS.projects, panel: true },
  { key: s('g', R), word: WORDS.graph, panel: true },
  { key: s('w', R), word: WORDS.burn, panel: true, pane: 'burn' },
  { key: s('s', R), word: WORDS.sessions, panel: true },
  { key: s('l', R), word: WORDS.limits, panel: true, pane: 'limits' },
  { key: s('j/k', I), word: s('move', R) },
  { key: s('?', R), word: s('help', R) },
  { key: s('q', R), word: s('quit', R) },
];

/**
 * Every registered string that claims a source is verbatim in that source.
 * Throws naming the first that is not, so the build fails rather than the
 * hero showing a name the screenshots no longer do.
 */
export function checkDemo(files: Record<Exclude<Provenance, 'invented'>, string>): void {
  for (const { text, from } of DEMO) {
    if (from === 'invented') continue;
    if (!files[from].includes(text)) {
      throw new Error(`the hero shows ${JSON.stringify(text)}, which is no longer in the ${from} file`);
    }
  }
}

/** Whether a piece of text is one of the registered strings. */
export function isDemo(text: string): boolean {
  return DEMO.some((d) => d.text === text);
}
