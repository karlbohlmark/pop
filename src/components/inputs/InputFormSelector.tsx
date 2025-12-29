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
import type { InputStream, InputStreamType } from "@/lib/types";
import { RtpInputForm } from "./forms/RtpInputForm";
import { RistInputForm } from "./forms/RistInputForm";
import { RtpGeneratorForm } from "./forms/RtpGeneratorForm";
import { FromChannelForm } from "./forms/FromChannelForm";
import { SdiInputForm } from "./forms/SdiInputForm";
import { GeneratorInputForm } from "./forms/GeneratorInputForm";

interface InputFormSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: number;
  onSubmit: (channelId: number, input: InputStream) => Promise<{ success: boolean; error?: string }>;
}

const inputTypes: { value: InputStreamType; label: string; description: string }[] = [
  { value: "rtp", label: "RTP", description: "RTP unicast or multicast input" },
  { value: "rist", label: "RIST", description: "RIST protocol input via tunnel" },
  { value: "rtp_generator", label: "RTP Generator", description: "Synthetic RTP test pattern" },
  { value: "from_channel", label: "From Channel", description: "Route from another channel" },
  { value: "sdi", label: "SDI", description: "SDI input from DeckLink device" },
  { value: "generator", label: "Generator", description: "Video pattern generator" },
];

export function InputFormSelector({ open, onOpenChange, channelId, onSubmit }: InputFormSelectorProps) {
  const [selectedType, setSelectedType] = useState<InputStreamType | null>(null);

  const handleSubmit = async (input: InputStream) => {
    const result = await onSubmit(channelId, input);
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
        return <RtpInputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "rist":
        return <RistInputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "rtp_generator":
        return <RtpGeneratorForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "from_channel":
        return <FromChannelForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "sdi":
        return <SdiInputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
      case "generator":
        return <GeneratorInputForm channelId={channelId} onSubmit={handleSubmit} onCancel={handleCancel} />;
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
          <DialogTitle>Add Input Stream</DialogTitle>
          <DialogDescription>
            Configure an input stream for Channel {channelId}
          </DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Input Type</Label>
              <Select onValueChange={(value) => setSelectedType(value as InputStreamType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose input type..." />
                </SelectTrigger>
                <SelectContent>
                  {inputTypes.map((type) => (
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
