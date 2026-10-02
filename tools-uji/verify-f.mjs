import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mcp = join(root, "mcp-server");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// F-mode DIBATALKAN total: tidak boleh ada sisa mode plan/build di kode.
// (Kolom DB di-drop via migrasi; riwayat git/PR jadi arsip.)
const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("skema drop kolom mode", schema.includes("DROP COLUMN IF EXISTS mode"));
cek("kolom is_private", schema.includes("ADD COLUMN IF NOT EXISTS is_private"));
const cmd = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("API tanpa mode", !cmd.includes("mode"));
const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal tanpa selector mode", !modal.includes("Mode AI") && !modal.includes("CommandMode"));
const src = readFileSync(join(mcp, "src/index.ts"), "utf8");
cek("tool tanpa aturan mode", !src.includes("WAJIB patuhi") && !src.includes("mode plan"));
const tasks = readFileSync(join(root, "lib/tasks.ts"), "utf8");
cek("tipe tanpa CommandMode", !tasks.includes("CommandMode"));
const queue = readFileSync(join(root, "lib/queue.ts"), "utf8");
cek("queue tanpa mode", !queue.includes("CommandMode") && !queue.includes("mode,"));

// F-visibility
for (const f of ["app/api/repos/visibility/route.ts", "components/shell/LoginLanding.tsx", "components/shell/AppShell.tsx"]) {
  cek(f, existsSync(join(root, f)));
}
const vis = readFileSync(join(root, "app/api/repos/visibility/route.ts"), "utf8");
cek("visibility PATCH GitHub", vis.includes("PATCH") && vis.includes("/repos/"));
const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu tombol gembok", card.includes("onVisibility") && card.includes("private"));

// F-login / F-logout
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
cek("layout via AppShell", layout.includes("AppShell") && !layout.includes("<Sidebar"));
const landing = readFileSync(join(root, "components/shell/LoginLanding.tsx"), "utf8");
cek("landing OAuth-style (kamus)", landing.includes("user.masukDenganGithub"));
const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("logout confirm (kamus)", sidebar.includes("user.tanyaKeluar") || sidebar.includes("user.yaKeluar"));

import { readdirSync, statSync } from "node:fs";
const kena = [];
(function jalan(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== "node_modules") jalan(p);
    } else if (/\.(tsx?|mts)$/.test(e)) {
      const isi = readFileSync(p, "utf8");
      if (/window\.(confirm|alert)\s*\(/.test(isi)) kena.push(p.replace(root, "").slice(1));
    }
  }
})(join(root, "app"));
(function jalan2(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      jalan2(p);
    } else if (/\.(tsx?|mts)$/.test(e)) {
      const isi = readFileSync(p, "utf8");
      if (/window\.(confirm|alert)\s*\(/.test(isi)) kena.push(p.replace(root, "").slice(1));
    }
  }
})(join(root, "components"));
cek("tanpa window.confirm/alert", kena.length === 0, kena.join(", "));

if (gagal > 0) {
  console.log(`\nF-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nF-CEK: ALL-OK");
