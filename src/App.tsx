import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ChannelList } from "@/components/channels/ChannelList";
import { TunnelList } from "@/components/tunnels/TunnelList";
import { ConfigManager } from "@/components/config/ConfigManager";
import type { View } from "@/components/layout/Sidebar";
import "./index.css";

export function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "channels":
        return <ChannelList />;
      case "tunnels":
        return <TunnelList />;
      case "config":
        return <ConfigManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </MainLayout>
  );
}

export default App;
