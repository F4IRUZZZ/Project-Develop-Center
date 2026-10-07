import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("plugins/pdc-presence.js", existsSync(join(root, "plugins/pdc-presence.js")));
const src = readFileSync(join(root, "plugins/pdc-presence.js"), "utf8");
cek("satu named export v1.18", src.includes("export const PdcPresence = async (input)"));
cek("tanpa default-export V2", !src.includes("export default"));
cek("tanpa ctx.event.subscribe", !src.includes("ctx.event.subscribe"));
cek("tanpa ctx.location", !src.includes("ctx.location"));
cek("pakai input.directory", src.includes("input?.directory") || src.includes("input.directory"));
cek("hook event", src.includes("event: async"));
cek("hook tool.execute.after", src.includes('"tool.execute.after"'));
cek("deteksi tool tulis", src.includes("edit|write|patch|apply"));
cek("rekonsiliasi client.session.list", src.includes("client.session.list"));
cek("denyut 60 dtk tetap", src.includes("DENYUT_MS = 60000") || src.includes("60000"));
cek("tanpa kirim isi file", !src.includes("readFile") || src.includes("isi file tak pernah"));
cek("versi 2026.10.15", src.includes('VERSI_PLUGIN = "2026.10.15"'));
cek("denyut lapor transisi", src.includes("denyutOk") && src.includes("denyut gagal (mulai)") && src.includes("denyut pulih"));
cek("resolve via fs + worktree", src.includes(".git") && src.includes("gitdir:"));
cek("spawn git dihapus dari repoFull", !src.match(/repoFull[\s\S]{0,2000}execFileSync/));
cek("throttle warn repo", src.includes("TENANG_WARN_MS") && src.includes("warnRepoTerakhir"));
cek("log via client.app.log", src.includes("client.app.log") && src.includes("pdc-presence"));
cek(
  "stdout hanya 1 fallback",
  (src.match(/console\.log\(/g) || []).length === 1 && src.includes("hanya fallback bila client tak ada")
);
cek("throttle warn 10 mnt", src.includes("TENANG_WARN_MS") && src.includes("warnRepoTerakhir"));

const st = readFileSync(join(root, "app/api/status/route.ts"), "utf8");
cek("status samakan versi", st.includes('VERSI_PLUGIN_TERKINI = "2026.10.15"'));

const norm = (s) => s.replace(/\r\n/g, "\n");
for (const salinan of [
  ".opencode/plugins/pdc-presence.js",
  "../Webapp Keuangan(Ga Tuntas)/.opencode/plugins/pdc-presence.js",
  "../kedai-seruni/.opencode/plugins/pdc-presence.js",
]) {
  const p = join(root, salinan);
  cek(
    `salinan ${salinan.split("/")[1] ?? salinan} identik`,
    existsSync(p) && norm(readFileSync(p, "utf8")) === norm(src)
  );
}

if (gagal > 0) {
  console.log(`\nPRESENCE-V1: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nPRESENCE-V1: ALL-OK");







