import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RtpInputStream } from "@/lib/types";

interface RtpInputFormProps {
  channelId: number;
  onSubmit: (input: RtpInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function RtpInputForm({ channelId, onSubmit, onCancel }: RtpInputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [localIp, setLocalIp] = useState("0.0.0.0");
  const [localPort, setLocalPort] = useState("5000");
  const [multicastAddress, setMulticastAddress] = useState("");
  const [useFec, setUseFec] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "rtp",
      channelId,
      streamId: parseInt(streamId),
      localIp,
      localPort: parseInt(localPort),
      multicastAddress: multicastAddress || undefined,
      useFec,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to add input");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="multicastAddress">Multicast Address (optional)</Label>
        <Input
          id="multicastAddress"
          value={multicastAddress}
          onChange={(e) => setMulticastAddress(e.target.value)}
          placeholder="e.g., 239.0.0.1"
        />
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
