import { defineCollection } from 'astro:content';
import { docsLoader, releaseLoader } from './loaders/aiu';

export const collections = {
  release: defineCollection({ loader: releaseLoader() }),
  docs: defineCollection({ loader: docsLoader() }),
};
