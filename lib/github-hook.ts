import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { buatId } from "@/lib/id";

const BATAS_BYTE = 1024 * 1024;

export function verifikasiSignature(body: string, header: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  if (!secret || !header) return false;
  const hitung = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(hitung);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function bacaBatas(body: string): boolean {
  return Buffer.byteLength(body) <= BATAS_BYTE;
}

interface PushEvent {
  commits?: Array<{ message?: string }>;
  ref?: string;
  repository?: { full_name?: string };
}

interface PullEvent {
  action?: string;
  number?: number;
  merged?: boolean;
  pull_request?: { title?: string; merged?: boolean };
  repository?: { full_name?: string };
}

interface IssueEvent {
  action?: string;
  issue?: { number?: number; title?: string; pull_request?: unknown };
  repository?: { full_name?: string };
}

export async function tulisActivity(
  userId: string,
  projectId: string,
  type: "commit" | "pr" | "issue",
  message: string
) {
  await db()`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${userId}, ${projectId}, ${type}, ${message})`;
}

export async function proyekUntukRepo(fullName: string): Promise<{ id: string; user_id: string } | null> {
  const rows = await db()`SELECT id, user_id FROM projects WHERE repo_full = ${fullName} AND is_active = true LIMIT 10`;
  const row = rows[0] as { id: string; user_id: string } | undefined;
  return row ?? null;
}

export function ringkasPush(e: PushEvent): string | null {
  const full = e.repository?.full_name;
  if (!full) return null;
  const n = e.commits?.length ?? 0;
  const branch = (e.ref ?? "").replace("refs/heads/", "");
  const pertama = e.commits?.[0]?.message?.split("\n")[0]?.slice(0, 80) ?? "";
  return `Push ${n} commit ke ${branch}${pertama ? ` — ${pertama}` : ""}`;
}

export function ringkasPull(e: PullEvent): { message: string; merged: boolean } | null {
  const action = e.action ?? "";
  const n = e.number ?? 0;
  const title = e.pull_request?.title ?? "";
  if (!["opened", "reopened", "closed"].includes(action)) return null;
  if (action === "closed" && (e.pull_request?.merged ?? e.merged)) {
    return { message: `Merge PR #${n}${title ? ` — ${title}` : ""}.`, merged: true };
  }
  if (action === "closed") return { message: `PR #${n} ditutup tanpa merge.`, merged: false };
  return { message: `PR #${n} dibuka${title ? ` — ${title}` : ""}.`, merged: false };
}

export function ringkasIssue(e: IssueEvent): string | null {
  if (e.action !== "opened" || e.issue?.pull_request) return null;
  return `Issue #${e.issue?.number} dibuka${e.issue?.title ? ` — ${e.issue.title}` : ""}.`;
}
