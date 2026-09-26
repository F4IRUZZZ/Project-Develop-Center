import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const wajib = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "app/layout.tsx",
  "app/globals.css",
  "app/page.tsx",
  "lib/utils.ts",
  "PROGRESS.md",
];
for (const f of wajib) cek(f, existsSync(join(root, f)));

try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  cek("dep next", Boolean(pkg.dependencies?.next), String(pkg.dependencies?.next ?? ""));
  cek("dep tailwindcss", Boolean(pkg.devDependencies?.tailwindcss ?? pkg.dependencies?.tailwindcss));
  cek("dep lucide-react", Boolean(pkg.dependencies?.["lucide-react"]));
} catch (e) {
  cek("package.json terbaca", false, String(e));
}

try {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  cek("token Nebula --background", css.includes("--background: #0a0a0f"));
  cek("tailwind import", css.includes('@import "tailwindcss"'));
} catch (e) {
  cek("globals.css terbaca", false, String(e));
}

try {
  const page = readFileSync(join(root, "app/page.tsx"), "utf8");
  cek("page C0 marker", page.includes("C0 Scaffold OK"));
} catch (e) {
  cek("page.tsx terbaca", false, String(e));
}

if (gagal > 0) {
  console.log(`\nC0-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nC0-CEK: ALL-OK");
