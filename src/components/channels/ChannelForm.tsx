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
import type { ChannelCreateParams } from "@/lib/types";

interface ChannelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: ChannelCreateParams) => Promise<{ success: boolean; error?: string }>;
}

export function ChannelForm({ open, onOpenChange, onSubmit }: ChannelFormProps) {
  const [channelId, setChannelId] = useState("");
  const [description, setDescription] = useState("");
  const [bufferDurationMs, setBufferDurationMs] = useState("1500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      channelId: parseInt(channelId),
      description,
      bufferDurationMs: parseInt(bufferDurationMs),
    });

    setLoading(false);

    if (result.success) {
      setChannelId("");
      setDescription("");
      setBufferDurationMs("1500");
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to create channel");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Add a new channel for media stream routing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              type="number"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="e.g., 1000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Main Feed"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bufferDurationMs">Buffer Duration (ms)</Label>
            <Input
              id="bufferDurationMs"
              type="number"
              value={bufferDurationMs}
              onChange={(e) => setBufferDurationMs(e.target.value)}
              placeholder="1500"
              min="0"
              required
            />
            <p className="text-xs text-muted-foreground">
              Buffer duration in milliseconds. Default is 1500ms.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
