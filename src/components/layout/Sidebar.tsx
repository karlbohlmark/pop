import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Tv2,
  Cable,
  Settings,
  Save,
} from "lucide-react";

export type View = "dashboard" | "channels" | "tunnels" | "config";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { view: "channels", label: "Channels", icon: <Tv2 className="h-5 w-5" /> },
  { view: "tunnels", label: "Tunnels", icon: <Cable className="h-5 w-5" /> },
  { view: "config", label: "Configuration", icon: <Save className="h-5 w-5" /> },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/40 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">ZTV Controller</h1>
        <p className="text-sm text-muted-foreground">Media Stream Manager</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              currentView === item.view
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
