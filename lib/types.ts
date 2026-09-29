export type AIStatus = "idle" | "working" | "waiting" | "completed" | "failed" | "stuck";

export interface Project {
  id: string;
  repoName: string;
  repoFull: string;
  status: AIStatus;
  statusLabel: string;
  taskLabel: string;
  taskPrefix: "Tugas" | "Terakhir";
  progress: number;
  progressTone: "accent" | "warning" | "success";
  meta: string;
  branch?: string;
  isPrivate?: boolean;
  sesiAktif?: boolean;
  sesiKerja?: "bekerja" | "siaga" | null;
  sesiRingkasan?: string | null;
  actions: Array<"command" | "stop">;
}

export interface ActivityEvent {
  id: string;
  type: "working" | "waiting" | "success" | "idle";
  message: string;
  projectName: string;
  time: string;
}
