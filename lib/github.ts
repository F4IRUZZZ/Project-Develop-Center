import type { Project } from "./types";

export async function fetchDashboard(): Promise<Project[]> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`API dashboard ${res.status}`);
  return (await res.json()) as Project[];
}
