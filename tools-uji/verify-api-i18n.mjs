import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { galat, langApi, pesan } from "../lib/galat-api.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("lib/galat-api.ts", existsSync(join(root, "lib/galat-api.ts")));
const lib = readFileSync(join(root, "lib/galat-api.ts"), "utf8");
const pasangan = [...lib.matchAll(/([a-zA-Z0-9]+):\s*\{\s*id:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g)];
cek("kunci >= 30", pasangan.length >= 30, `dapat ${pasangan.length}`);
cek("semua en non-empty", pasangan.every((m) => m[3].trim().length > 0));
cek("default ID tanpa header", langApi({ headers: { get: () => null } }) === "id");
cek("en via header", langApi({ headers: { get: (n) => (n === "accept-language" ? "en-US,en;q=0.9" : null) } }) === "en");
cek("browser ID header", langApi({ headers: { get: (n) => (n === "accept-language" ? "id-ID,id;q=0.9" : null) } }) === "id");
const fakeId = { headers: { get: () => null } };
const fakeEn = { headers: { get: (n) => (n === "accept-language" ? "en" : null) } };
cek("galat ID", galat(fakeId, "bodyInvalid") === "Body JSON tidak valid");
cek("galat EN", galat(fakeEn, "bodyInvalid") === "Invalid JSON body");
cek("pesan() langsung", pesan("sesiHilang", "en") === "Session not found" && pesan("sesiHilang", "id") === "Sesi tidak ketemu");

// Sapu semua route: tanpa literal Indonesia di respons error.
const sisa = [];
(function jalan(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== "node_modules") jalan(p);
    } else if (p.endsWith("route.ts")) {
      const isi = readFileSync(p, "utf8");
      const kena = [...isi.matchAll(/\{\s*error:\s*"([^"]+)"/g)].map((m) => m[1]).filter((s) => /tidak|wajib|belum|dikenal|dicabut|ulang|besar|karakter|ketemu/.test(s));
      if (kena.length > 0) sisa.push(`${p.split("app\\api\\")[1]}: ${kena.join(" | ")}`);
    }
  }
})(join(root, "app/api"));
cek("tanpa literal ID di error API", sisa.length === 0, sisa.join("; ").slice(0, 300));

const sa = readFileSync(join(root, "lib/server-auth.ts"), "utf8");
cek("sesiUser via galat", sa.includes('galat(req, "belumLogin")') && sa.includes('galat(req, "dbBelum")'));

if (gagal > 0) {
  console.log(`\nAPI-I18N: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nAPI-I18N: ALL-OK");
