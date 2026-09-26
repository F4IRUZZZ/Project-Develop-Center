import {
  Bell,
  FolderGit2,
  History,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true, badge: null },
  { label: "Proyek", icon: FolderGit2, active: false, badge: null },
  { label: "Riwayat", icon: History, active: false, badge: null },
  { label: "Notifikasi", icon: Bell, active: false, badge: "2" },
  { label: "Pengaturan", icon: Settings, active: false, badge: null },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-border bg-card px-3.5 py-[18px] lg:flex">
      <div className="flex items-center gap-2.5 px-1.5 pb-[22px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-violet-500 font-bold text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
          P
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Develop Center</div>
          <div className="text-[11px] font-medium text-muted-foreground">Project</div>
        </div>
      </div>

      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Menu
      </div>
      <nav>
        {NAV.map((item) => (
          <div
            key={item.label}
            className={cn(
              "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {item.label}
            {item.badge && (
              <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          AD
        </div>
        <div>
          <div className="text-[13px] font-medium">@andi_dev</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
            Connected
          </div>
        </div>
      </div>
    </aside>
  );
}
