import type { ActivityEvent, Project } from "./types";

export const stats = {
  proyekAktif: 3,
  aiBekerja: 1,
  tugasSelesai: 12,
};

export const projects: Project[] = [
  {
    id: "p1",
    repoName: "my-awesome-project",
    repoFull: "andi/my-awesome-project",
    status: "working",
    statusLabel: "Working",
    taskLabel: "Implementasi login page",
    taskPrefix: "Tugas",
    progress: 45,
    progressTone: "accent",
    meta: "2m lalu · feature/login",
    branch: "feature/login",
    actions: ["detail", "command", "stop"],
  },
  {
    id: "p2",
    repoName: "ecommerce-api",
    repoFull: "andi/ecommerce-api",
    status: "waiting",
    statusLabel: "Waiting",
    taskLabel: "Fix bug checkout · PR #14",
    taskPrefix: "Tugas",
    progress: 100,
    progressTone: "warning",
    meta: "15m lalu · menunggu merge",
    actions: ["detail", "merge"],
  },
  {
    id: "p3",
    repoName: "portfolio-site",
    repoFull: "andi/portfolio-site",
    status: "idle",
    statusLabel: "Idle",
    taskLabel: "Optimasi images",
    taskPrefix: "Terakhir",
    progress: 100,
    progressTone: "success",
    meta: "3j lalu · selesai",
    actions: ["detail", "command"],
  },
];

export const activityFeed: ActivityEvent[] = [
  { id: "a1", type: "working", message: "Progress — LoginForm 45%", projectName: "my-awesome-project", time: "2m lalu" },
  { id: "a2", type: "waiting", message: "PR dibuat — AI buka PR #14", projectName: "ecommerce-api", time: "15m lalu" },
  { id: "a3", type: "success", message: "Selesai — Optimasi images", projectName: "portfolio-site", time: "3j lalu" },
  { id: "a4", type: "idle", message: "Commit — fix: checkout validation", projectName: "ecommerce-api", time: "3j lalu" },
];
