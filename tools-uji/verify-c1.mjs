import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["components/shell/Sidebar.tsx", "components/shell/Topbar.tsx", "app/layout.tsx", "app/page.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("sidebar 232px", sidebar.includes("w-[232px]"));
cek("nav Dashboard", sidebar.includes("Dashboard"));
cek("nav Notifikasi badge live (E2)", sidebar.includes("NotifBadge") && !sidebar.includes('badge: "2"'));
cek("user box session-aware (D2)", sidebar.includes("UserBox") && sidebar.includes("useSession"));

const topbar = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("topbar 58px", topbar.includes("h-[58px]"));
cek("search placeholder", topbar.includes("Cari proyek"));

const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
cek("layout pakai AppShell+Sidebar", layout.includes("AppShell"));
cek("shell render Sidebar+Topbar", readFileSync(join(root, "components/shell/AppShell.tsx"), "utf8").includes("Sidebar"));

if (gagal > 0) {
  console.log(`\nC1-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nC1-CEK: ALL-OK");
