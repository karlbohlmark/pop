import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Trash2 } from "lucide-react";
import type { Tunnel } from "@/lib/types";

interface TunnelCardProps {
  tunnel: Tunnel;
  onDelete: (tunnelId: number) => Promise<{ success: boolean; error?: string }>;
}

export function TunnelCard({ tunnel, onDelete }: TunnelCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(tunnel.tunnelId);
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tunnel {tunnel.tunnelId}</CardTitle>
              <CardDescription>
                {tunnel.localIp}:{tunnel.localPort} → {tunnel.remoteIp}:{tunnel.remotePort}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {tunnel.authentication === "keepAlive" ? "Keep Alive" : "No Auth"}
              </Badge>
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
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Local Endpoint:</span>
              <p className="font-medium">{tunnel.localIp}:{tunnel.localPort}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Remote Endpoint:</span>
              <p className="font-medium">{tunnel.remoteIp}:{tunnel.remotePort}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Secret:</span>
              <p className="font-mono text-xs">
                {tunnel.secret.length > 16
                  ? `${tunnel.secret.slice(0, 8)}...${tunnel.secret.slice(-8)}`
                  : tunnel.secret}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Authentication:</span>
              <p className="font-medium">{tunnel.authentication}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tunnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Tunnel {tunnel.tunnelId}?
              Any streams using this tunnel will be affected.
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
    </>
  );
}
