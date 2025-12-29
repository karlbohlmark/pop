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
import type { SdiOutputStream } from "@/lib/types";

interface SdiOutputFormProps {
  channelId: number;
  onSubmit: (output: SdiOutputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

const videoModes = [
  "1080p24", "1080p25", "1080p30", "1080p50", "1080p60",
  "1080i50", "1080i5994", "1080i60",
  "720p50", "720p5994", "720p60",
  "2160p24", "2160p25", "2160p30", "2160p50", "2160p60",
];

const pixelFormats = ["8bit", "10bit"];

export function SdiOutputForm({ channelId, onSubmit, onCancel }: SdiOutputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [deviceIndex, setDeviceIndex] = useState("0");
  const [portIndex, setPortIndex] = useState("0");
  const [videoMode, setVideoMode] = useState("1080p30");
  const [pixelFormat, setPixelFormat] = useState("10bit");
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
      portIndex: parseInt(portIndex),
      videoMode,
      pixelFormat,
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
        <div className="space-y-2">
          <Label htmlFor="portIndex">Port Index</Label>
          <Input
            id="portIndex"
            type="number"
            value={portIndex}
            onChange={(e) => setPortIndex(e.target.value)}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoMode">Video Mode</Label>
        <Select value={videoMode} onValueChange={setVideoMode}>
          <SelectTrigger>
            <SelectValue placeholder="Select video mode" />
          </SelectTrigger>
          <SelectContent>
            {videoModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pixelFormat">Pixel Format</Label>
        <Select value={pixelFormat} onValueChange={setPixelFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Select pixel format" />
          </SelectTrigger>
          <SelectContent>
            {pixelFormats.map((format) => (
              <SelectItem key={format} value={format}>
                {format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
