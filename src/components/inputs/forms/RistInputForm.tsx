import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RistInputStream } from "@/lib/types";

interface RistInputFormProps {
  channelId: number;
  onSubmit: (input: RistInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function RistInputForm({ channelId, onSubmit, onCancel }: RistInputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [tunnelId, setTunnelId] = useState("");
  const [localIp, setLocalIp] = useState("0.0.0.0");
  const [localPort, setLocalPort] = useState("5000");
  const [useFec, setUseFec] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "rist",
      channelId,
      streamId: parseInt(streamId),
      tunnelId: parseInt(tunnelId),
      localIp,
      localPort: parseInt(localPort),
      useFec,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to add input");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="streamId">Stream ID</Label>
          <Input
            id="streamId"
            type="number"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tunnelId">Tunnel ID</Label>
          <Input
            id="tunnelId"
            type="number"
            value={tunnelId}
            onChange={(e) => setTunnelId(e.target.value)}
            min="0"
            required
          />
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

      <div className="flex items-center space-x-2">
        <Switch
          id="useFec"
          checked={useFec}
          onCheckedChange={setUseFec}
        />
        <Label htmlFor="useFec">Enable FEC</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Input"}
        </Button>
      </div>
    </form>
  );
}
