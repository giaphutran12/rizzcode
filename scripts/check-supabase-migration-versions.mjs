import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import process from "node:process";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");
const migrationPattern = /^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/;

let entries;
try {
  entries = await readdir(migrationsDirectory, { withFileTypes: true });
} catch (error) {
  console.error(
    `Could not read ${migrationsDirectory}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}

const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => basename(entry.name))
  .sort();

if (files.length === 0) {
  console.error("No Supabase migration files were found.");
  process.exit(1);
}

const invalidNames = files.filter((file) => !migrationPattern.test(file));
if (invalidNames.length > 0) {
  console.error(
    "Migration filenames must use <14-digit UTC timestamp>_<snake-case-name>.sql:",
  );
  for (const file of invalidNames) console.error(`- ${file}`);
  process.exit(1);
}

const versions = new Map();
for (const file of files) {
  const version = migrationPattern.exec(file)?.[1];
  const sameVersion = versions.get(version) ?? [];
  sameVersion.push(file);
  versions.set(version, sameVersion);
}

const duplicates = [...versions.entries()].filter(
  ([, versionFiles]) => versionFiles.length > 1,
);
if (duplicates.length > 0) {
  console.error("Duplicate Supabase migration version IDs found:");
  for (const [version, versionFiles] of duplicates) {
    console.error(`- ${version}: ${versionFiles.join(", ")}`);
  }
  process.exit(1);
}

console.log(
  `Supabase migration versions are valid: ${files.length} unique migrations.`,
);
