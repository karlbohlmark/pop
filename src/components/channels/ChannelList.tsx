import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { ChannelCard } from "./ChannelCard";
import { ChannelForm } from "./ChannelForm";

export function ChannelList() {
  const { channels, loading, error, createChannel, deleteChannel, addInput, addOutput, removeInput, removeOutput } = useChannels();
  const [formOpen, setFormOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Channels</h2>
          <p className="text-muted-foreground">
            Manage media stream channels and their inputs/outputs
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {channels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No channels</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new channel.
          </p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Channel
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.channelId}
              channel={channel}
              onDelete={deleteChannel}
              onAddInput={addInput}
              onAddOutput={addOutput}
              onRemoveInput={removeInput}
              onRemoveOutput={removeOutput}
            />
          ))}
        </div>
      )}

      <ChannelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createChannel}
      />
    </div>
  );
}
