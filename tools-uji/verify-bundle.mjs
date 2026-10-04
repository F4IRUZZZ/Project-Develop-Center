import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const cfg = readFileSync(join(root, "next.config.ts"), "utf8");
cek("wrapper analyzer opt-in", cfg.includes("@next/bundle-analyzer") && cfg.includes('ANALYZE === "1"'));
cek("config default utuh", cfg.includes("remotePatterns") && cfg.includes("avatars.githubusercontent.com"));

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
cek("script analyze", (pkg.scripts?.analyze ?? "").includes("ANALYZE=1") && (pkg.scripts.analyze ?? "").includes("next build"));
cek("dep bundle-analyzer", Boolean(pkg.devDependencies?.["@next/bundle-analyzer"]));
cek("build normal tak terpengaruh", !cfg.includes("enabled: true"));

if (gagal > 0) {
  console.log(`\nBUNDLE: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nBUNDLE: ALL-OK");
