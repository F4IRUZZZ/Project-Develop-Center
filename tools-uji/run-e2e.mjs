import { spawn } from "node:child_process";
import { createServer } from "node:net";

// Runner E2E: build diasumsikan sudah hijau. Cari port bebas (BUKAN port dev),
// jalankan `next start`, tunggu siap, run playwright, matikan server.
// Port dev milik user tidak pernah disentuh (AGENTS.md §1).
function portBebas() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const p = typeof addr === "object" && addr ? addr.port : 0;
      s.close(() => resolve(p));
    });
  });
}

async function tungguSiap(url, batasMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < batasMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* belum siap */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server tak siap: ${url}`);
}

const port = await portBebas();
const base = `http://127.0.0.1:${port}`;
console.log(`E2E server: ${base}`);
const srv = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  stdio: "ignore",
  env: { ...process.env, PORT: String(port) },
});

let kode = 1;
try {
  await tungguSiap(base + "/");
  const pw = spawn("npx", ["playwright", "test"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PDC_E2E_URL: base },
  });
  kode = await new Promise((res) => pw.on("close", res));
} finally {
  srv.kill("SIGKILL");
}
process.exit(kode ?? 1);
