import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RtpGeneratorInputStream } from "@/lib/types";

interface RtpGeneratorFormProps {
  channelId: number;
  onSubmit: (input: RtpGeneratorInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function RtpGeneratorForm({ channelId, onSubmit, onCancel }: RtpGeneratorFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [targetBitrateBps, setTargetBitrateBps] = useState("3000000");
  const [packetSizeBytes, setPacketSizeBytes] = useState("1328");
  const [generatePsi, setGeneratePsi] = useState(false);
  const [pmtPid, setPmtPid] = useState("4096");
  const [videoPid, setVideoPid] = useState("256");
  const [psiIntervalPackets, setPsiIntervalPackets] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "rtp_generator",
      channelId,
      streamId: parseInt(streamId),
      targetBitrateBps: parseInt(targetBitrateBps),
      packetSizeBytes: parseInt(packetSizeBytes),
      generatePsi,
      pmtPid: parseInt(pmtPid),
      videoPid: parseInt(videoPid),
      psiIntervalPackets: parseInt(psiIntervalPackets),
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
          <Label htmlFor="targetBitrateBps">Target Bitrate (bps)</Label>
          <Input
            id="targetBitrateBps"
            type="number"
            value={targetBitrateBps}
            onChange={(e) => setTargetBitrateBps(e.target.value)}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packetSizeBytes">Packet Size (bytes)</Label>
          <Input
            id="packetSizeBytes"
            type="number"
            value={packetSizeBytes}
            onChange={(e) => setPacketSizeBytes(e.target.value)}
            min="1"
            max="1500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="generatePsi"
          checked={generatePsi}
          onCheckedChange={setGeneratePsi}
        />
        <Label htmlFor="generatePsi">Generate PSI Tables</Label>
      </div>

      {generatePsi && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pmtPid">PMT PID</Label>
            <Input
              id="pmtPid"
              type="number"
              value={pmtPid}
              onChange={(e) => setPmtPid(e.target.value)}
              min="16"
              max="8191"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoPid">Video PID</Label>
            <Input
              id="videoPid"
              type="number"
              value={videoPid}
              onChange={(e) => setVideoPid(e.target.value)}
              min="16"
              max="8191"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="psiIntervalPackets">PSI Interval</Label>
            <Input
              id="psiIntervalPackets"
              type="number"
              value={psiIntervalPackets}
              onChange={(e) => setPsiIntervalPackets(e.target.value)}
              min="1"
            />
          </div>
        </div>
      )}

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
