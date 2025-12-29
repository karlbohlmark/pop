import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { OutputStream, OutputStreamType } from "@/lib/types";
import { RtpOutputForm } from "./forms/RtpOutputForm";
import { RistOutputForm } from "./forms/RistOutputForm";
import { UdpOutputForm } from "./forms/UdpOutputForm";
import { SdiOutputForm } from "./forms/SdiOutputForm";

interface OutputFormSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: number;
  onSubmit: (channelId: number, output: OutputStream) => Promise<{ success: boolean; error?: string }>;
}

const outputTypes: { value: OutputStreamType; label: string; description: string }[] = [
  { value: "rtp", label: "RTP", description: "RTP unicast output" },
  { value: "rist", label: "RIST", description: "RIST protocol output" },
  { value: "udp", label: "UDP", description: "Raw UDP output" },
  { value: "sdi", label: "SDI", description: "SDI output to DeckLink device" },
];

export function OutputFormSelector({ open, onOpenChange, channelId, onSubmit }: OutputFormSelectorProps) {
  const [selectedType, setSelectedType] = useState<OutputStreamType | null>(null);

  const handleSubmit = async (output: OutputStream) => {
    const result = await onSubmit(channelId, output);
    if (result.success) {
      setSelectedType(null);
      onOpenChange(false);
    }
    return result;
  };

  const handleCancel = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const renderForm = () => {
    switch (selectedType) {
      case "rtp":
        return <RtpOutputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "rist":
        return <RistOutputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "udp":
        return <UdpOutputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "sdi":
        return <SdiOutputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setSelectedType(null);
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Output Stream</DialogTitle>
          <DialogDescription>
            Configure an output stream for Channel {channelId}
          </DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Output Type</Label>
              <Select onValueChange={(value) => setSelectedType(value as OutputStreamType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose output type..." />
                </SelectTrigger>
                <SelectContent>
                  {outputTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          renderForm()
        )}
      </DialogContent>
    </Dialog>
  );
}
