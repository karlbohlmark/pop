import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TunnelCreateParams, TunnelAuthentication, TunnelMode } from "@/lib/types";

interface TunnelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: TunnelCreateParams) => Promise<{ success: boolean; error?: string }>;
}

export function TunnelForm({ open, onOpenChange, onSubmit }: TunnelFormProps) {
  const [tunnelId, setTunnelId] = useState("");
  const [mode, setMode] = useState<TunnelMode>("client");
  const [localIp, setLocalIp] = useState("0.0.0.0");
  const [localPort, setLocalPort] = useState("20001");
  const [remoteIp, setRemoteIp] = useState("");
  const [remotePort, setRemotePort] = useState("20001");
  const [secret, setSecret] = useState("");
  const [authentication, setAuthentication] = useState<TunnelAuthentication>("keepAlive");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      tunnelId: parseInt(tunnelId),
      mode,
      localIp,
      localPort: parseInt(localPort),
      remoteIp: mode === "server" ? "" : remoteIp,
      remotePort: mode === "server" ? 0 : parseInt(remotePort),
      secret,
      authentication,
    });

    setLoading(false);

    if (result.success) {
      setTunnelId("");
      setMode("client");
      setLocalIp("0.0.0.0");
      setLocalPort("20001");
      setRemoteIp("");
      setRemotePort("20001");
      setSecret("");
      setAuthentication("keepAlive");
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to create tunnel");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tunnel</DialogTitle>
          <DialogDescription>
            Add a new RIST tunnel connection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tunnelId">Tunnel ID</Label>
              <Input
                id="tunnelId"
                type="number"
                value={tunnelId}
                onChange={(e) => setTunnelId(e.target.value)}
                placeholder="e.g., 1"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as TunnelMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localIp">Local IP</Label>
              <Input
                id="localIp"
                value={localIp}
                onChange={(e) => setLocalIp(e.target.value)}
                placeholder="0.0.0.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localPort">Local Port</Label>
              <Input
                id="localPort"
                type="number"
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                min="1"
                max="65535"
                required
              />
            </div>
          </div>

          {mode === "client" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="remoteIp">Remote IP</Label>
                <Input
                  id="remoteIp"
                  value={remoteIp}
                  onChange={(e) => setRemoteIp(e.target.value)}
                  placeholder="e.g., 10.0.0.21"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remotePort">Remote Port</Label>
                <Input
                  id="remotePort"
                  type="number"
                  value={remotePort}
                  onChange={(e) => setRemotePort(e.target.value)}
                  min="1"
                  max="65535"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="secret">Secret (hex)</Label>
            <Input
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="e.g., f7e8f74bac70bcfb396566b1aab20271"
              required
            />
            <p className="text-xs text-muted-foreground">
              Authentication secret (max 64 hex characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authentication">Authentication</Label>
            <Select value={authentication} onValueChange={(v) => setAuthentication(v as TunnelAuthentication)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="keepAlive">Keep Alive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Tunnel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
