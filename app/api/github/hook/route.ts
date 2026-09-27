import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  if (!bacaBatas(mentah)) return NextResponse.json({ error: "Body terlalu besar" }, { status: 413 });
  if (!verifikasiSignature(mentah, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") return NextResponse.json({ ok: true, msg: "pong" });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(mentah) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
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
    await tulisActivity(proyek.user_id, proyek.id, "pr", r.message);
    if (r.merged) {
      await db()`UPDATE tasks SET status = 'completed', progress = 100, completed_at = now(), updated_at = now(), result_summary = 'PR di-merge (webhook GitHub).' WHERE user_id = ${proyek.user_id} AND project_id = ${proyek.id} AND status = 'waiting'`;
    }
    return NextResponse.json({ ok: true });
  }

  if (event === "issues") {
    const msg = ringkasIssue(body as never);
    if (msg) await tulisActivity(proyek.user_id, proyek.id, "issue", msg);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, abaikan: `event ${event}` });
}
