// The changelog as a feed, so a reader can watch releases without watching the
// repository. Hand-rolled rather than pulled in: the site ships no Astro
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
  const prefix = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const page = new URL(`${prefix}changelog/`, site!);
  const self = new URL(`${prefix}changelog.xml`, site!);

  const items = release.feed.map((entry) => {
    const slug = headings.find((h) => h.text.includes(entry.version))?.slug;
    const link = slug ? `${page.href}#${slug}` : page.href;
    return [
      '  <item>',
      `    <title>${xmlEscape(`${release.name} ${entry.tag}`)}</title>`,
      `    <link>${xmlEscape(link)}</link>`,
      `    <guid isPermaLink="false">${xmlEscape(`${release.repository}/releases/tag/${entry.tag}`)}</guid>`,
      `    <pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate>`,
      `    <description>${xmlEscape(entry.summary)}</description>`,
      '  </item>',
    ].join('\n');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${xmlEscape(`${release.name} releases`)}</title>`,
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
