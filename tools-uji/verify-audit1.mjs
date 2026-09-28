import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// H1 — provider keys beneran tersimpan
for (const f of ["app/api/provider-keys/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}
const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel provider_keys", schema.includes("CREATE TABLE IF NOT EXISTS provider_keys"));
const prov = readFileSync(join(root, "app/api/provider-keys/route.ts"), "utf8");
cek("enkripsi + tanpa nilai balik", prov.includes("enkrip(") && !prov.includes("key_enc AS key") && prov.includes("SELECT provider"));
const peng = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("UI panggil API + status", peng.includes("/api/provider-keys") && peng.includes("tersimpan"));

// H2 — hapus akun beneran
cek("app/api/account/route.ts", existsSync(join(root, "app/api/account/route.ts")));
const hapus = readFileSync(join(root, "app/api/account/route.ts"), "utf8");
cek("hapus revoke + users", hapus.includes("revoked = true") && hapus.includes("DELETE FROM users"));
cek("UI signOut setelah hapus", peng.includes("/api/account") && peng.includes("signOut()"));

// M1 — nama repo asli di antrian
const panel = readFileSync(join(root, "components/command/QueuePanel.tsx"), "utf8");
cek("panel resolve nama via API", panel.includes("/api/projects") && !panel.includes("lib/mock"));

// M3 — tolak project asing
const cmd = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("validasi proyek 404", cmd.includes("tidak ketemu, sync dulu") && !cmd.includes("WHERE NOT EXISTS"));

// M5 — route warisan hilang
cek("api/repos dihapus", !existsSync(join(root, "app/api/repos/route.ts")));
const gh = readFileSync(join(root, "lib/github.ts"), "utf8");
cek("fetchLiveProjects dihapus", !gh.includes("fetchLiveProjects"));

if (gagal > 0) {
  console.log(`\nAUDIT1-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nAUDIT1-CEK: ALL-OK");
