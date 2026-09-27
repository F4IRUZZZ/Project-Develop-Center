import { db } from "./db";
import { tokenGitHub } from "./server-auth";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  pushed_at: string;
  private: boolean;
}

export const MAX_REPO = 10;

export async function syncProjects(userId: string): Promise<Record<string, unknown>[]> {
  const accessToken = await tokenGitHub(userId);
  if (!accessToken) throw new Error("Token GitHub tidak tersedia, login ulang");

  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=pushed", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const repos = (await res.json()) as GitHubRepo[];
  const top = repos
    .sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, MAX_REPO);

  const sql = db();
  for (const r of top) {
    await sql`
      INSERT INTO projects (id, user_id, repo_name, repo_full, repo_url, default_branch, is_private, updated_at)
      VALUES (${`gh-${r.id}`}, ${userId}, ${r.name}, ${r.full_name}, ${r.html_url}, ${r.default_branch}, ${r.private}, now())
      ON CONFLICT (user_id, repo_full) DO UPDATE SET
        repo_name = EXCLUDED.repo_name,
        repo_url = EXCLUDED.repo_url,
        default_branch = EXCLUDED.default_branch,
        is_private = EXCLUDED.is_private,
        is_active = true,
        updated_at = now()
    `;
  }

  return (await sql`SELECT * FROM projects WHERE user_id = ${userId} AND is_active = true ORDER BY updated_at DESC`) as Record<string, unknown>[];
}
