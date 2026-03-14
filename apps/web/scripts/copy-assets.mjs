import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules/@ideamode/assets");
const dest = join(root, "public");

if (!existsSync(src)) {
  console.warn("apps/web: @ideamode/assets not found, skipping asset copy");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const name of ["ideamode_icon.svg", "ideamode_logo.svg"]) {
  const srcFile = join(src, name);
  if (existsSync(srcFile)) {
    cpSync(srcFile, join(dest, name));
    console.log("Copied", name, "to public/");
  }
}
