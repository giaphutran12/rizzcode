import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/BRAND_SYSTEM.md",
  "docs/brand/README.md",
  "docs/brand/source/rizzcode-meter-brand-board.png",
  "public/brand/rizzcode-lockup.png",
  "public/brand/rizzcode-lockup-inverse.png",
  "public/brand/rizzcode-mark.png",
  "public/brand/rizzcode-mark-inverse.png",
  "public/brand/rizzcode-meter-wordmark.png",
  "src/design-system/BrandLogo.tsx",
  "src/design-system/BrandPrimitives.tsx",
  "src/design-system/components.css",
  "src/design-system/index.ts",
  "src/design-system/theme.ts",
  "src/design-system/tokens.css",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

const legacyHexBudgets = {
  "src/styles/baseline.css": 47,
  "src/styles/global.css": 14,
  "src/styles/product.css": 52,
  "src/styles/taste.css": 39,
};
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;

for (const directory of ["src/design-system", "src/styles"]) {
  const fullDirectory = path.join(root, directory);
  for (const entry of fs.readdirSync(fullDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".css")) continue;
    const relative = path.posix.join(directory, entry.name);
    if (relative === "src/design-system/tokens.css") continue;
    const content = fs.readFileSync(path.join(root, relative), "utf8");
    const count = content.match(hexPattern)?.length ?? 0;
    const budget = legacyHexBudgets[relative] ?? 0;
    if (count > budget) {
      failures.push(
        `${relative} contains ${count} raw colors; its allowed legacy budget is ${budget}. Use brand tokens.`,
      );
    }
  }
}

const protectedBrandSurfaces = [
  "src/components/TasteExperience.tsx",
  "src/components/auth/AuthViews.tsx",
  "src/components/product/ProductShell.tsx",
];

for (const file of protectedBrandSurfaces) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (!content.includes("<BrandLogo")) {
    failures.push(`${file} must render the canonical BrandLogo component.`);
  }
  if (/>RC<\/span>/.test(content)) {
    failures.push(`${file} still contains the deprecated RC placeholder mark.`);
  }
}

const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
for (const stylesheet of [
  "../design-system/tokens.css",
  "../design-system/components.css",
]) {
  if (!layout.includes(stylesheet)) {
    failures.push(`Root layout must import ${stylesheet}.`);
  }
}

if (failures.length > 0) {
  console.error("RizzCode brand check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("RizzCode brand check passed.");
