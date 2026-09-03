// The site's own routes, for a crawler. An endpoint rather than a file in
// `public/`, because `<loc>` has to be absolute and only the build knows the
// origin. `PAGES` is the same table the header nav is built from, so a page
// cannot be added to the site and left out of this.

import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { PAGES } from '../lib/pages';
import { xmlEscape } from '../lib/source';

export const GET: APIRoute = async ({ site }) => {
  const { date } = (await getEntry('release', 'current'))!.data;
  const prefix = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const urls = PAGES.map(({ path }) => new URL(`${prefix}${path}`, site!).href);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((loc) => `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${date}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
