import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GeneratorInputStream } from "@/lib/types";

interface GeneratorInputFormProps {
  channelId: number;
  onSubmit: (input: GeneratorInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function GeneratorInputForm({ channelId, onSubmit, onCancel }: GeneratorInputFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [fpsNum, setFpsNum] = useState("30");
  const [fpsDen, setFpsDen] = useState("1");
  const [bitrate, setBitrate] = useState("5000000");
  const [keyframeInterval, setKeyframeInterval] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "generator",
      channelId,
      streamId: parseInt(streamId),
      width: parseInt(width),
      height: parseInt(height),
      fpsNum: parseInt(fpsNum),
      fpsDen: parseInt(fpsDen),
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
          <Label htmlFor="width">Width</Label>
          <Input
            id="width"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fpsNum">FPS Numerator</Label>
          <Input
            id="fpsNum"
            type="number"
            value={fpsNum}
            onChange={(e) => setFpsNum(e.target.value)}
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fpsDen">FPS Denominator</Label>
          <Input
            id="fpsDen"
            type="number"
            value={fpsDen}
            onChange={(e) => setFpsDen(e.target.value)}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bitrate">Bitrate (bps)</Label>
          <Input
            id="bitrate"
            type="number"
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            min="1000"
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
