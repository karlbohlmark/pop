import { Sidebar, type View } from "./Sidebar";
import { Header } from "./Header";
import { useZtvStatus } from "@/hooks/useZtvStatus";

interface MainLayoutProps {
  currentView: View;
  onViewChange: (view: View) => void;
  children: React.ReactNode;
}

export function MainLayout({ currentView, onViewChange, children }: MainLayoutProps) {
  const { status, start, stop, restart, loading } = useZtvStatus();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={onViewChange} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          status={status}
          onStart={start}
          onStop={stop}
          onRestart={restart}
          loading={loading}
        />
        <main className="flex-1 overflow-auto p-6" style={{ scrollbarGutter: "stable" }}>
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
