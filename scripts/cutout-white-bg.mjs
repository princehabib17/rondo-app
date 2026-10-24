// Turns a product shot on a white background into a trimmed transparent PNG.
// Usage: node scripts/cutout-white-bg.mjs <input> <output> [size]
import sharp from "sharp";

const [input, output, sizeArg] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: cutout-white-bg.mjs <input> <output> [size]");
  process.exit(1);
}
const size = Number(sizeArg ?? 640);

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  // White/near-grey background: bright and unsaturated. Gold stays saturated.
  const whiteness = min / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.12 && whiteness > 0.86) {
    const t = Math.min(1, (whiteness - 0.86) / 0.1);
    data[i + 3] = Math.round(255 * (1 - t));
  }
}

await sharp(data, { raw: info })
  .trim({ threshold: 1 })
  .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log("wrote", output);
