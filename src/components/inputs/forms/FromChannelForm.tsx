import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FromChannelInputStream } from "@/lib/types";

interface FromChannelFormProps {
  channelId: number;
  onSubmit: (input: FromChannelInputStream) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function FromChannelForm({ channelId, onSubmit, onCancel }: FromChannelFormProps) {
  const [streamId, setStreamId] = useState("1");
  const [sourceChannelId, setSourceChannelId] = useState("");
  const [pidRemap, setPidRemap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      type: "from_channel",
      channelId,
      streamId: parseInt(streamId),
      sourceChannelId: parseInt(sourceChannelId),
      pidRemap,
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
          <Label htmlFor="sourceChannelId">Source Channel ID</Label>
          <Input
            id="sourceChannelId"
            type="number"
            value={sourceChannelId}
            onChange={(e) => setSourceChannelId(e.target.value)}
            min="0"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="pidRemap"
          checked={pidRemap}
          onCheckedChange={setPidRemap}
        />
        <Label htmlFor="pidRemap">Enable PID Remapping</Label>
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
