import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["playwright.config.ts", "e2e/smoke.spec.ts", "tools-uji/run-e2e.mjs"]) {
  cek(f, existsSync(join(root, f)));
}

const cfg = readFileSync(join(root, "playwright.config.ts"), "utf8");
cek("tanpa port dev", !cfg.includes(":3000"));
cek("baseURL via env", cfg.includes("PDC_E2E_URL"));

const run = readFileSync(join(root, "tools-uji/run-e2e.mjs"), "utf8");
cek("port ephemeral", run.includes("listen(0") || run.includes("port: 0"));
cek("server dimatikan", run.includes("SIGKILL") || run.includes(".kill("));
cek("tanpa sentuh port dev", !run.includes(":3000"));

const spec = readFileSync(join(root, "e2e/smoke.spec.ts"), "utf8");
const jumlah = (spec.match(/\btest\(/g) ?? []).length;
cek("test >= 8", jumlah >= 8, `dapat ${jumlah}`);
cek("cek hydration #418", spec.includes("418") && spec.includes("hydration"));
cek("cek gate 401 ID+EN", spec.includes("Accept-Language") && spec.includes("401"));

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
cek("script test:e2e", pkg.scripts?.["test:e2e"] === "node tools-uji/run-e2e.mjs");
cek("dep @playwright/test", Boolean(pkg.devDependencies?.["@playwright/test"]));

if (gagal > 0) {
  console.log(`\nE2E: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nE2E: ALL-OK");
