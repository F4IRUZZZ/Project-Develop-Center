import { test, expect } from "@playwright/test";

// Smoke logged-out + API gates. Tanpa OAuth (butuh interaksi GitHub asli).
// Setiap test pakai konteks fresh (storage bersih) = default tema/kamus.

test("landing render + tombol GitHub", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /selamat datang kembali/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /masuk dengan github/i })).toBeVisible();
});

test("pengaturan tanpa sesi = gate login", async ({ page }) => {
  await page.goto("/pengaturan");
  await expect(page.getByRole("heading", { name: /selamat datang kembali|welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /masuk dengan github|sign in with github/i })).toBeVisible();
});

test("API dashboard tanpa auth = 401 Indonesia", async ({ request }) => {
  const r = await request.get("/api/dashboard");
  expect(r.status()).toBe(401);
  const b = (await r.json()) as { error?: string };
  expect(b.error ?? "").toMatch(/belum login|belum dikonfigurasi/i);
});

test("API dashboard header EN = 401 Inggris", async ({ request }) => {
  const r = await request.get("/api/dashboard", { headers: { "Accept-Language": "en-US,en;q=0.9" } });
  expect(r.status()).toBe(401);
  const b = (await r.json()) as { error?: string };
  expect(b.error ?? "").toMatch(/login required|not configured/i);
});

test("route /dashboard tidak ada = 404", async ({ page }) => {
  const r = await page.goto("/dashboard");
  expect(r?.status()).toBe(404);
});

test("default tema/kamus = storage bersih", async ({ page }) => {
  await page.goto("/");
  const tema = await page.evaluate(() => window.localStorage.getItem("pdc-tema"));
  const bahasa = await page.evaluate(() => window.localStorage.getItem("pdc-bahasa"));
  expect(tema).toBeNull();
  expect(bahasa).toBeNull();
  await expect(page.locator("html.dark")).toHaveCount(1);
});

test("landing bebas hydration/console error", async ({ page }) => {
  const buruk: string[] = [];
  page.on("pageerror", (e) => buruk.push(`pageerror: ${String(e).slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error") buruk.push(`console: ${m.text().slice(0, 200)}`);
  });
  await page.goto("/");
  await page.waitForTimeout(1500);
  const hidrasi = buruk.filter((s) => /418|hydration|did not match|didn't match/i.test(s));
  expect(hidrasi).toEqual([]);
});

test("API tasks + notifikasi tanpa auth = 401", async ({ request }) => {
  for (const p of ["/api/tasks", "/api/notifications", "/api/projects"]) {
    const r = await request.get(p);
    expect(r.status()).toBe(401);
  }
});
