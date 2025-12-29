import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, Trash2, Settings, FolderOpen } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import type { SavedConfiguration, LogLevel } from "@/lib/types";

export function ConfigManager() {
  const {
    configurations,
    loggingLevel,
    loading,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    updateLoggingLevel,
  } = useConfig();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<SavedConfiguration | null>(null);
  const [loadConfig, setLoadConfig] = useState<SavedConfiguration | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [ztvPath, setZtvPath] = useState("");
  const [ztvPathSaved, setZtvPathSaved] = useState(true);
  const [ztvPathSaving, setZtvPathSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ztv-path")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setZtvPath(data.data.path);
        }
      })
      .catch(console.error);
  }, []);

  const handleZtvPathSave = async () => {
    setZtvPathSaving(true);
    try {
      const res = await fetch("/api/settings/ztv-path", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: ztvPath }),
      });
      const data = await res.json();
      if (data.success) {
        setZtvPathSaved(true);
      }
    } catch (err) {
      console.error("Failed to save ZTV path:", err);
    }
    setZtvPathSaving(false);
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const result = await saveConfiguration(saveName.trim(), saveDescription.trim());
    setSaving(false);
    if (result.success) {
      setSaveName("");
      setSaveDescription("");
      setSaveDialogOpen(false);
    }
  };

  const handleLoad = async () => {
    if (!loadConfig) return;
    setActionLoading(true);
    await loadConfiguration(loadConfig.id);
    setActionLoading(false);
    setLoadConfig(null);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    setActionLoading(true);
    await deleteConfiguration(deleteConfig.id);
    setActionLoading(false);
    setDeleteConfig(null);
  };

  const handleLoggingChange = async (level: LogLevel) => {
    await updateLoggingLevel(level);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
          <p className="text-muted-foreground">
            Save and load ZTV configurations
          </p>
        </div>
        <Button onClick={() => setSaveDialogOpen(true)}>
          <Save className="mr-2 h-4 w-4" />
          Save Current Config
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            ZTV Executable Path
          </CardTitle>
          <CardDescription>
            Path to the ZTV executable binary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={ztvPath}
              onChange={(e) => {
                setZtvPath(e.target.value);
                setZtvPathSaved(false);
              }}
              placeholder="/path/to/ztv"
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleZtvPathSave}
              disabled={ztvPathSaved || ztvPathSaving}
              size="sm"
            >
              {ztvPathSaving ? "Saving..." : ztvPathSaved ? "Saved" : "Save"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The ZTV process will be started using this executable path.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Logging Settings
          </CardTitle>
          <CardDescription>
            Configure ZTV logging level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="loggingLevel">Log Level:</Label>
            <Select value={loggingLevel} onValueChange={handleLoggingChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trace">Trace</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-medium">Saved Configurations</h3>
        {configurations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No saved configurations yet. Save your current configuration to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {configurations.map((config) => (
              <Card key={config.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{config.name}</CardTitle>
                      {config.description && (
                        <CardDescription>{config.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLoadConfig(config)}
                      >
                        <Upload className="mr-1 h-3 w-3" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfig(config)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">
                      {config.channels.length} channel{config.channels.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="secondary">
                      {config.tunnels.length} tunnel{config.tunnels.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline">
                      Log: {config.loggingLevel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated: {new Date(config.updatedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
            <DialogDescription>
              Save the current ZTV configuration for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configName">Name</Label>
              <Input
                id="configName"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Production Setup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="configDescription">Description (optional)</Label>
              <Textarea
                id="configDescription"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Brief description of this configuration..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !saveName.trim()}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!loadConfig} onOpenChange={() => setLoadConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current configuration with "{loadConfig?.name}".
              The current configuration will be lost unless saved first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoad} disabled={actionLoading}>
              {actionLoading ? "Loading..." : "Load Configuration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfig?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
