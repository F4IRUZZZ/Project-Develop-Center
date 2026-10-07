import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { galat } from "@/lib/galat-api";
import { potong } from "@/lib/potong";
import { siarTelegram } from "@/lib/telegram";
import {
  bacaBatas,
  proyekUntukRepo,
  ringkasIssue,
  ringkasPull,
  ringkasPush,
  tulisActivity,
  verifikasiSignature,
} from "@/lib/github-hook";

// Webhook GitHub (F9). Auth = HMAC signature, bukan sesi (GitHub tak punya cookie).
export async function POST(req: Request) {
  const mentah = await req.text();
  if (!bacaBatas(mentah)) return NextResponse.json({ error: galat(req, "hookBesar") }, { status: 413 });
  if (!verifikasiSignature(mentah, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: galat(req, "hookSig") }, { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") return NextResponse.json({ ok: true, msg: "pong" });

  // M7: tolak pengiriman ulang (replay) delivery ID yang sama.
  const delivery = req.headers.get("x-github-delivery") ?? "";
  if (delivery) {
    const tandai = await db()`INSERT INTO webhook_deliveries (delivery_id) VALUES (${delivery}) ON CONFLICT DO NOTHING RETURNING delivery_id`;
    if (tandai.length === 0) return NextResponse.json({ ok: true, abaikan: "duplikat delivery" });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(mentah) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }

  const full = ((body.repository as { full_name?: string } | undefined)?.full_name ?? "") as string;
  if (!full) return NextResponse.json({ ok: true, abaikan: "tanpa repo" });

  const proyek = await proyekUntukRepo(full);
  if (!proyek) return NextResponse.json({ ok: true, abaikan: "repo tak dipantau" });

  if (event === "push") {
    const msg = ringkasPush(body as never);
    if (msg) await tulisActivity(proyek.user_id, proyek.id, "commit", msg);
    return NextResponse.json({ ok: true });
  }

  if (event === "pull_request") {
    const r = ringkasPull(body as never);
    if (!r) return NextResponse.json({ ok: true, abaikan: "aksi pr tak relevan" });
    const n = Number((body as { number?: unknown }).number) || 0;
    if (r.merged && n > 0) {
      // Penjaga anti-ganda (#190): merge dari tombol PDC sudah mencatat
      // + memberitahu ≤10 mnt lalu -> diam total (bunuh toast kedua).
      const pdc = await db()`SELECT id FROM activity_log
        WHERE id = ${`act-merge-webapp-${proyek.id}-${n}`} AND created_at > now() - interval '10 minutes' LIMIT 1`;
      if (pdc.length > 0) return NextResponse.json({ ok: true, abaikan: "merge sudah dicatat webapp" });
      // Kontrak Selesai: (#210, selaras webapp): SATU feed info prefix
      // "Selesai:" + ID deterministik + ON CONFLICT — retry delivery baru
      // tak ganda, filter penting tetap menangkap.
      const judulWh = potong((body as { pull_request?: { title?: string } }).pull_request?.title ?? "", 120);
      const pesanWh = `Selesai: PR #${n}${judulWh ? ` "${judulWh}"` : ""} di-merge (webhook GitHub).`;
      await db()`INSERT INTO activity_log (id, user_id, project_id, type, message)
        VALUES (${`act-merge-webhook-${proyek.id}-${n}`}, ${proyek.user_id}, ${proyek.id}, 'info', ${pesanWh})
        ON CONFLICT (id) DO NOTHING`;
      const tutup = (await db()`UPDATE tasks SET status = 'completed', progress = 100, completed_at = now(), updated_at = now(), result_summary = 'PR di-merge (webhook GitHub).' WHERE user_id = ${proyek.user_id} AND project_id = ${proyek.id} AND status IN ('waiting', 'working') RETURNING id`) as Array<{
        id: string;
      }>;
      if (tutup.length === 0) {
        await db()`INSERT INTO tasks (id, user_id, project_id, title, status, progress, result_summary, completed_at, updated_at)
          VALUES (${`task-merge-webhook-${proyek.id}-${n}`}, ${proyek.user_id}, ${proyek.id}, ${`Merge PR #${n} (webhook GitHub).`}, 'completed', 100, ${pesanWh.slice(0, 500)}, now(), now())
          ON CONFLICT (id) DO NOTHING`;
      }
      void siarTelegram(proyek.user_id, pesanWh).catch(() => {});
      return NextResponse.json({ ok: true });
    }
    await tulisActivity(proyek.user_id, proyek.id, "pr", r.message);
    return NextResponse.json({ ok: true });
  }

  if (event === "issues") {
    const msg = ringkasIssue(body as never);
    if (msg) await tulisActivity(proyek.user_id, proyek.id, "issue", msg);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, abaikan: `event ${event}` });
}
