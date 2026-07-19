import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(
  root,
  "docs/brand/source/rizzcode-meter-brand-board.png",
);
const outputDir = path.join(root, "public/brand");

const background = { r: 238, g: 228, b: 211 };
const cream = { r: 255, g: 248, b: 237 };

async function transparentCrop(name, crop, options = {}) {
  const { inverse = false, width } = options;
  let pipeline = sharp(source).extract(crop).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const distance = Math.sqrt(
      (red - background.r) ** 2 +
        (green - background.g) ** 2 +
        (blue - background.b) ** 2,
    );
    const alpha = Math.max(0, Math.min(255, ((distance - 8) / 34) * 255));
    if (inverse && alpha > 0) {
      data[index] = cream.r;
      data[index + 1] = cream.g;
      data[index + 2] = cream.b;
    }
    data[index + 3] = Math.round(alpha);
  }

  let result = sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  }).trim({ background: { ...background, alpha: 0 } });

  if (width) {
    result = result.resize({ width, withoutEnlargement: false });
  }

  await result.png({ compressionLevel: 9 }).toFile(path.join(outputDir, name));
}

await fs.mkdir(outputDir, { recursive: true });

await Promise.all([
  transparentCrop(
    "rizzcode-meter-wordmark.png",
    { left: 148, top: 224, width: 958, height: 362 },
    { width: 1200 },
  ),
  transparentCrop(
    "rizzcode-lockup.png",
    { left: 138, top: 704, width: 994, height: 248 },
    { width: 1200 },
  ),
  transparentCrop(
    "rizzcode-lockup-inverse.png",
    { left: 138, top: 704, width: 994, height: 248 },
    { inverse: true, width: 1200 },
  ),
  transparentCrop(
    "rizzcode-mark.png",
    { left: 142, top: 706, width: 252, height: 252 },
    { width: 512 },
  ),
  transparentCrop(
    "rizzcode-mark-inverse.png",
    { left: 142, top: 706, width: 252, height: 252 },
    { inverse: true, width: 512 },
  ),
  sharp(source)
    .resize({ width: 1600, withoutEnlargement: false })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, "rizzcode-brand-board.webp")),
]);

console.log("Built RizzCode brand assets in public/brand.");
