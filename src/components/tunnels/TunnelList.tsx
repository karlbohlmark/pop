import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTunnels } from "@/hooks/useTunnels";
import { TunnelCard } from "./TunnelCard";
import { TunnelForm } from "./TunnelForm";

export function TunnelList() {
  const { tunnels, loading, error, createTunnel, deleteTunnel } = useTunnels();
  const [formOpen, setFormOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading tunnels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tunnels</h2>
          <p className="text-muted-foreground">
            Manage RIST tunnel connections for secure streaming
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tunnel
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {tunnels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No tunnels</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a tunnel to enable RIST streaming over encrypted connections.
          </p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tunnel
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tunnels.map((tunnel) => (
            <TunnelCard
              key={tunnel.tunnelId}
              tunnel={tunnel}
              onDelete={deleteTunnel}
            />
          ))}
        </div>
      )}

      <TunnelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createTunnel}
      />
    </div>
  );
}
