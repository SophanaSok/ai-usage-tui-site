// Nothing to keep out: the site is a handful of pages with no search, no
// filters and no private corner. The line that earns this file is the one
// naming the sitemap.
//
// Only a crawler at the origin root reads this, which is one reason the site
// sits at the root of a domain of its own rather than under a project path on
// github.io, where the root belongs to another repository.

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const prefix = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemap = new URL(`${prefix}sitemap.xml`, site!);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
