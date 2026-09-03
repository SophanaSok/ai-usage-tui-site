// The social card, cut from a trusted screenshot at build time.
//
// Kept out of `source.ts` so that file stays importable under Node's type
// stripping without dragging a native module in behind it.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OG, assetSize } from './source';

/** The card: the top of the dashboard screenshot, resized to 1.91:1. */
export async function renderCard(dir: string): Promise<Buffer> {
  const { default: sharp } = await import('sharp');
  const size = assetSize(dir, OG.from);
  if (size.width !== OG.source.width || size.height !== OG.source.height) {
    throw new Error(
      `${OG.from} is ${size.width}x${size.height}, not ${OG.source.width}x${OG.source.height}. ` +
        `Its intrinsic size changed; OG.crop was chosen for the old one.`,
    );
  }
  return sharp(readFileSync(resolve(dir, OG.from)))
    .extract(OG.crop)
    .resize(OG.width, OG.height, { fit: 'cover', kernel: 'lanczos3' })
    .flatten({ background: OG.mat })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}
