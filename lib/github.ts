import type { Project } from "./types";

export async function fetchLiveProjects(): Promise<Project[]> {
  const res = await fetch("/api/repos", { cache: "no-store" });
  if (!res.ok) throw new Error(`API repos ${res.status}`);
  return (await res.json()) as Project[];
}
