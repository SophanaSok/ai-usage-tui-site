// The changelog as a feed, so a reader can watch releases without watching the
// repository, with the write-up as one more item dated by its own opening
// line. Hand-rolled rather than pulled in: the site ships no Astro
// integrations, and this is a documented static endpoint.
//
// No CDATA anywhere. A rendered changelog entry can contain `]]>`, which would
// end the section early; escaping every item is the version that cannot.

import type { APIRoute } from 'astro';
import { getEntry, render } from 'astro:content';
import { xmlEscape } from '../lib/source';

export const GET: APIRoute = async ({ site }) => {
  const release = (await getEntry('release', 'current'))!.data;
  // The anchors the changelog page actually rendered, so every item links to
  // the entry it summarises rather than to a slug guessed from the heading.
  const { headings } = await render((await getEntry('docs', 'changelog'))!);
  // The write-up's title is the document's own heading, and its date the
  // line under it; neither is written here.
  const post = (await getEntry('docs', 'measurement'))!;
  const postTitle = (await render(post)).headings.find((h) => h.depth === 1)?.text;
  if (!post.data.date || !postTitle) throw new Error(`${post.data.source} gives the feed no date or no title`);
  const prefix = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const page = new URL(`${prefix}changelog/`, site!);
  const self = new URL(`${prefix}changelog.xml`, site!);

  const item = (title: string, link: string, guid: string, date: string, description: string) =>
    [
      '  <item>',
      `    <title>${xmlEscape(title)}</title>`,
      `    <link>${xmlEscape(link)}</link>`,
      `    <guid isPermaLink="false">${xmlEscape(guid)}</guid>`,
      `    <pubDate>${new Date(`${date}T00:00:00Z`).toUTCString()}</pubDate>`,
      `    <description>${xmlEscape(description)}</description>`,
      '  </item>',
    ].join('\n');

  const entries = release.feed.map((entry) => {
    const slug = headings.find((h) => h.text.includes(entry.version))?.slug;
    const link = slug ? `${page.href}#${slug}` : page.href;
    const guid = `${release.repository}/releases/tag/${entry.tag}`;
    return { date: entry.date, xml: item(`${release.name} ${entry.tag}`, link, guid, entry.date, entry.summary) };
  });
  entries.push({
    date: post.data.date,
    xml: item(
      postTitle,
      new URL(`${prefix}what-a-max-subscription-bought/`, site!).href,
      `${release.repository}/blob/${release.tag}/${post.data.source}`,
      post.data.date,
      post.data.description,
    ),
  });
  // Newest first. The sort is stable, so a piece written on a release day
  // follows that day's release rather than interrupting the run of tags.
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const items = entries.map((e) => e.xml);

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${xmlEscape(`${release.name} releases and writing`)}</title>`,
    `  <link>${xmlEscape(page.href)}</link>`,
    `  <atom:link href="${xmlEscape(self.href)}" rel="self" type="application/rss+xml" />`,
    `  <description>${xmlEscape(release.description)}</description>`,
    '  <language>en</language>',
    ...items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
