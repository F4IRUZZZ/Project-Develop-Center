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

// F-mode
for (const f of ["app/api/repos/visibility/route.ts", "components/shell/LoginLanding.tsx", "components/shell/AppShell.tsx"]) {
  cek(f, existsSync(join(root, f)));
}
const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("kolom mode", schema.includes("ADD COLUMN IF NOT EXISTS mode"));
cek("kolom is_private", schema.includes("ADD COLUMN IF NOT EXISTS is_private"));
const cmd = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("API terima mode", cmd.includes("mode"));
const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal selector plan/build", modal.includes('"plan"') && modal.includes('"build"') && modal.includes("Mode AI"));
cek("modal catatan advisory", modal.includes("dipatuhi agent"));
const src = readFileSync(join(mcp, "src/index.ts"), "utf8");
cek("tool patuhi mode", src.includes("WAJIB patuhi"));

// F-visibility
const vis = readFileSync(join(root, "app/api/repos/visibility/route.ts"), "utf8");
cek("visibility PATCH GitHub", vis.includes("PATCH") && vis.includes("/repos/"));
const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu tombol gembok", card.includes("onVisibility") && card.includes("private"));

// F-login / F-logout
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
cek("layout via AppShell", layout.includes("AppShell") && !layout.includes("<Sidebar"));
const landing = readFileSync(join(root, "components/shell/LoginLanding.tsx"), "utf8");
cek("landing OAuth-style", landing.includes("Masuk dengan GitHub"));
const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("logout confirm", sidebar.includes("Yakin keluar"));

if (gagal > 0) {
  console.log(`\nF-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nF-CEK: ALL-OK");
