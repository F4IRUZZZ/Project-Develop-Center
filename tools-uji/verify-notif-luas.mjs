import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const notif = readFileSync(join(root, "app/api/notifications/route.ts"), "utf8");
cek("selesai masuk filter", notif.includes("Selesai:%"));
cek("pr+error tetap", notif.includes("'pr', 'error'"));
cek("info hanya via Selesai:", notif.includes("a.type = 'info' AND a.message LIKE 'Selesai:%'"));
cek("LEFT JOIN yatim", notif.includes("LEFT JOIN projects"));
cek("batas 24 jam", notif.includes("24 hours"));
cek("filter ?type= allowlist", notif.includes("BOLEH_FILTER") && notif.includes('"progress"'));
cek("auth sesiUser", notif.includes("sesiUser"));

const act = readFileSync(join(root, "app/api/activity/route.ts"), "utf8");
cek("activity LEFT JOIN", act.includes("LEFT JOIN projects") && !act.includes(" a JOIN projects"));
cek("activity limit 20 tetap", act.includes("LIMIT 20"));

const hook = readFileSync(join(root, "lib/github-hook.ts"), "utf8");
cek("tulisActivity error+info", hook.includes('"error"') && hook.includes('"info"'));

const mcp = readFileSync(join(root, "mcp-server/src/index.ts"), "utf8");
cek("kontrak prefix Selesai:", mcp.includes("Selesai: ${summary}") && mcp.includes("P3"));

const hal = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("halaman ikon selesai", hal.includes("CircleCheck") && hal.includes('e.type === "info"'));
cek("halaman empty tetap (kamus)", hal.includes("notif.kosongJudul"));

const panel = readFileSync(join(root, "components/shell/PanelNotifikasi.tsx"), "utf8");
cek("panel lonceng ada (#229)", panel.includes("PanelNotifikasi") && panel.includes("fetchNotifikasi"));
cek("panel link tunggal lihat-semua (#229)", panel.includes('href="/notifikasi"') && panel.includes("notif.lihatSemua") && panel.includes("setBuka(false)"));
cek("panel state kosong/loading/error (#229)", panel.includes("notif.kosongJudul") && panel.includes("animate-pulse") && panel.includes("notif.gagal"));
cek("panel tandai + siar (#229)", panel.includes("tandaiDibaca") && panel.includes("siarNotifikasi"));
cek("panel tutup klik-luar/Escape (#229)", panel.includes("mousedown") && panel.includes("Escape"));
const top = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("topbar pakai panel (#229)", top.includes("PanelNotifikasi") && !top.includes('href="/notifikasi"'));
const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
cek("kamus panel (#229)", ["notif.panelJudul", "notif.lihatSemua", "notif.gagal", "notif.cobaLagi"].every((k) => kamus.includes(`"${k}"`)));
cek("pemicu 44px (#231)", panel.includes("h-11 w-11") && panel.includes('aria-haspopup="dialog"'));
cek("tandai optimistis+rollback (#231)", panel.includes("sebelum") && panel.includes("gagalTandai") && panel.includes("siarNotifikasi"));
cek("unauth tanpa coba-lagi (#231)", panel.includes("notif.masukDulu"));
cek("dialog a11y + waktu floor (#231)", panel.includes('role="dialog"') && panel.includes("Math.floor") && panel.includes("tombolRef"));
cek("dialog labelledby (#237)", panel.includes('aria-labelledby="panel-notif-judul"') && panel.includes('id="panel-notif-judul"'));
cek("tandaiDibaca cek ok (#231)", readFileSync(join(root, "lib/notifikasi.ts"), "utf8").includes("if (!res.ok) throw"));
cek("kamus tandai/masuk (#231)", ["notif.masukDulu", "notif.gagalTandai"].every((k) => kamus.includes(`"${k}"`)));
const halNotif = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("halaman waktu floor (#235)", halNotif.includes("Math.floor((Date.now()"));
cek("halaman tandai 44px+catch (#235)", halNotif.includes("min-h-11") && halNotif.includes("setGagalTandai(true)") && halNotif.includes("notif.gagalTandai"));

if (gagal > 0) {
  console.log(`\nNOTIF-LUAS: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nNOTIF-LUAS: ALL-OK");
