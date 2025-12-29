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
import type { SdiInputStream } from "@/lib/types";

interface SdiInputFormProps {
  channelId: number;
  onSubmit: (input: SdiInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

const displayModes = [
  "1080p24", "1080p25", "1080p30", "1080p50", "1080p60",
  "1080i50", "1080i5994", "1080i60",
  "720p50", "720p5994", "720p60",
  "2160p24", "2160p25", "2160p30", "2160p50", "2160p60",
];

export function SdiInputForm({ channelId, onSubmit, onCancel }: SdiInputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [deviceIndex, setDeviceIndex] = useState("0");
  const [displayMode, setDisplayMode] = useState("1080i5994");
  const [bitrate, setBitrate] = useState("50000000");
  const [keyframeInterval, setKeyframeInterval] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "sdi",
      channelId,
      streamId: parseInt(streamId),
      deviceIndex: parseInt(deviceIndex),
      displayMode,
      bitrate: parseInt(bitrate),
      keyframeInterval: parseInt(keyframeInterval),
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
          <Label htmlFor="deviceIndex">Device Index</Label>
          <Input
            id="deviceIndex"
            type="number"
            value={deviceIndex}
            onChange={(e) => setDeviceIndex(e.target.value)}
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayMode">Display Mode</Label>
        <Select value={displayMode} onValueChange={setDisplayMode}>
          <SelectTrigger>
            <SelectValue placeholder="Select display mode" />
          </SelectTrigger>
          <SelectContent>
            {displayModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bitrate">Bitrate (bps)</Label>
          <Input
            id="bitrate"
            type="number"
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            min="1000000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="keyframeInterval">Keyframe Interval</Label>
          <Input
            id="keyframeInterval"
            type="number"
            value={keyframeInterval}
            onChange={(e) => setKeyframeInterval(e.target.value)}
            min="1"
            required
          />
        </div>
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
