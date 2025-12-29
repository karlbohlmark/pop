import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UdpOutputStream } from "@/lib/types";

interface UdpOutputFormProps {
  channelId: number;
  onSubmit: (output: UdpOutputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function UdpOutputForm({ channelId, onSubmit, onCancel }: UdpOutputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [localIp, setLocalIp] = useState("0.0.0.0");
  const [localPort, setLocalPort] = useState("4010");
  const [remoteIp, setRemoteIp] = useState("");
  const [remotePort, setRemotePort] = useState("");
  const [delayMs, setDelayMs] = useState("2000");
  const [packetFormat, setPacketFormat] = useState<"ts" | "rtp">("rtp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "udp",
      channelId,
      streamId: parseInt(streamId),
      localIp,
      localPort: parseInt(localPort),
      remoteIp,
      remotePort: parseInt(remotePort),
      delayMs: parseInt(delayMs),
      packetFormat,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to add output");
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="remoteIp">Remote IP</Label>
          <Input
            id="remoteIp"
            value={remoteIp}
            onChange={(e) => setRemoteIp(e.target.value)}
            placeholder="e.g., 192.168.1.100"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="delayMs">Delay (ms)</Label>
          <Input
            id="delayMs"
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(e.target.value)}
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packetFormat">Packet Format</Label>
          <Select value={packetFormat} onValueChange={(v) => setPacketFormat(v as "ts" | "rtp")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rtp">RTP</SelectItem>
              <SelectItem value="ts">MPEG-TS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Output"}
        </Button>
      </div>
    </form>
  );
}
