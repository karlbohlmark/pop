import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BitRate, BitRatePair } from "@/components/ui/bitrate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Channel, InputStream, OutputStream } from "@/lib/types";
import { InputFormSelector } from "@/components/inputs/InputFormSelector";
import { OutputFormSelector } from "@/components/outputs/OutputFormSelector";
import { useStatistics } from "@/hooks/useStatistics";

interface ChannelCardProps {
  channel: Channel;
  onDelete: (channelId: number) => Promise<{ success: boolean; error?: string }>;
  onAddInput: (channelId: number, input: InputStream) => Promise<{ success: boolean; error?: string }>;
  onAddOutput: (channelId: number, output: OutputStream) => Promise<{ success: boolean; error?: string }>;
  onRemoveInput: (channelId: number, streamId: number) => Promise<{ success: boolean; error?: string }>;
  onRemoveOutput: (channelId: number, streamId: number) => Promise<{ success: boolean; error?: string }>;
}

function InputTypeLabel({ type }: { type: InputStream["type"] }) {
  const labels: Record<InputStream["type"], string> = {
    rtp: "RTP",
    rist: "RIST",
    rtp_generator: "RTP Generator",
    from_channel: "From Channel",
    sdi: "SDI",
    generator: "Generator",
  };
  return <Badge variant="outline">{labels[type]}</Badge>;
}

function OutputTypeLabel({ type }: { type: OutputStream["type"] }) {
  const labels: Record<OutputStream["type"], string> = {
    rtp: "RTP",
    rist: "RIST",
    udp: "UDP",
    sdi: "SDI",
  };
  return <Badge variant="outline">{labels[type]}</Badge>;
}

export function ChannelCard({ channel, onDelete, onAddInput, onAddOutput, onRemoveInput, onRemoveOutput }: ChannelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [outputDialogOpen, setOutputDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingStream, setRemovingStream] = useState<number | null>(null);

  const { bitrates } = useStatistics();

  // Get bitrates for this channel
  const channelBitrates = bitrates?.channels.find((c) => c.channelId === channel.channelId);
  const streamBitrates = bitrates?.channelStreams.find((c) => c.channelId === channel.channelId);

  const getInputBitrate = (streamId: number) => {
    return streamBitrates?.inputs.find((s) => s.streamId === streamId)?.bitsPerSecond ?? 0;
  };

  const getOutputBitrate = (streamId: number) => {
    return streamBitrates?.outputs.find((s) => s.streamId === streamId)?.bitsPerSecond ?? 0;
  };

  const handleRemoveInput = async (streamId: number) => {
    setRemovingStream(streamId);
    await onRemoveInput(channel.channelId, streamId);
    setRemovingStream(null);
  };

  const handleRemoveOutput = async (streamId: number) => {
    setRemovingStream(streamId);
    await onRemoveOutput(channel.channelId, streamId);
    setRemovingStream(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(channel.channelId);
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <div>
                <CardTitle className="text-base">
                  Channel {channel.channelId}
                </CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {channelBitrates && (channelBitrates.inputBps > 0 || channelBitrates.outputBps > 0) ? (
                <BitRatePair
                  inBitsPerSecond={channelBitrates.inputBps}
                  outBitsPerSecond={channelBitrates.outputBps}
                  compact
                  className="text-sm"
                />
              ) : (
                <Badge variant="secondary">
                  {channel.bufferDurationMs}ms buffer
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Inputs ({channel.inputs.length})</h4>
                <Button size="sm" variant="outline" onClick={() => setInputDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Input
                </Button>
              </div>
              {channel.inputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inputs configured</p>
              ) : (
                <div className="space-y-2">
                  {channel.inputs.map((input, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <InputTypeLabel type={input.type} />
                        <span>Stream {input.streamId}</span>
                        <span className="text-muted-foreground">
                          {input.type === "rtp" && `${input.localIp}:${input.localPort}`}
                          {input.type === "rist" && `Tunnel ${input.tunnelId}`}
                          {input.type === "rtp_generator" && `target ${((input.targetBitrateBps ?? 3000000) / 1000000).toFixed(1)} Mbps`}
                          {input.type === "from_channel" && `Channel ${input.sourceChannelId}`}
                          {input.type === "sdi" && `Device ${input.deviceIndex}`}
                          {input.type === "generator" && `${input.width ?? 1920}x${input.height ?? 1080}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BitRate
                          bitsPerSecond={getInputBitrate(input.streamId)}
                          direction="in"
                          compact
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveInput(input.streamId)}
                          disabled={removingStream === input.streamId}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Outputs ({channel.outputs.length})</h4>
                <Button size="sm" variant="outline" onClick={() => setOutputDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Output
                </Button>
              </div>
              {channel.outputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outputs configured</p>
              ) : (
                <div className="space-y-2">
                  {channel.outputs.map((output, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <OutputTypeLabel type={output.type} />
                        <span>Stream {output.streamId}</span>
                        <span className="text-muted-foreground">
                          {output.type === "rtp" && `${output.remoteIp}:${output.remotePort}`}
                          {output.type === "rist" && `${output.remoteIp}:${output.remotePort}`}
                          {output.type === "udp" && `${output.remoteIp}:${output.remotePort}`}
                          {output.type === "sdi" && `Device ${output.deviceIndex}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BitRate
                          bitsPerSecond={getOutputBitrate(output.streamId)}
                          direction="out"
                          compact
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveOutput(output.streamId)}
                          disabled={removingStream === output.streamId}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Channel {channel.channelId} ({channel.description})?
              This will also remove all associated inputs and outputs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InputFormSelector
        open={inputDialogOpen}
        onOpenChange={setInputDialogOpen}
        channelId={channel.channelId}
        onSubmit={onAddInput}
      />

      <OutputFormSelector
        open={outputDialogOpen}
        onOpenChange={setOutputDialogOpen}
        channelId={channel.channelId}
        onSubmit={onAddOutput}
      />
    </>
  );
}
