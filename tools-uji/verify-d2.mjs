import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of [
  "lib/auth.ts",
  "app/api/auth/[...nextauth]/route.ts",
  "lib/github.ts",
  "components/shell/Providers.tsx",
  "components/dashboard/LoginCard.tsx",
  ".env.example",
  "app/page.tsx",
]) {
  cek(f, existsSync(join(root, f)));
}

const auth = readFileSync(join(root, "lib/auth.ts"), "utf8");
cek("provider GitHub", auth.includes("GitHubProvider"));
cek("scope repo", auth.includes("repo"));
cek("strategi jwt", auth.includes('"jwt"'));
cek("token server-side (tanpa session callback)", !auth.includes("session("));

cek("route warisan repos dihapus", !existsSync(join(root, "app/api/repos/route.ts")));
const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("401 via sesiUser", dash.includes("401") || readFileSync(join(root, "lib/server-auth.ts"), "utf8").includes("401"));
cek("max 10 repo via sync", readFileSync(join(root, "lib/sync.ts"), "utf8").includes("MAX_REPO"));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("page LoginCard saat logout", page.includes("LoginCard"));
cek("page fetch live saat login", page.includes("fetchLiveProjects") || page.includes("fetchDashboard"));

const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("sidebar useSession", sidebar.includes("useSession"));
cek("sidebar logout", sidebar.includes("signOut"));

const env = readFileSync(join(root, ".env.example"), "utf8");
cek("env contoh tanpa secret asli", env.includes("GITHUB_ID=") && !env.includes("gho_"));

if (gagal > 0) {
  console.log(`\nD2-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nD2-CEK: ALL-OK");
