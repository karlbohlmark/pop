import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCw } from "lucide-react";
import type { ZtvStatus } from "@/lib/types";

interface HeaderProps {
  status: ZtvStatus | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  loading: boolean;
}

export function Header({ status, onStart, onStop, onRestart, loading }: HeaderProps) {
  const isRunning = status?.running ?? false;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">ZTV Process:</span>
        <Badge variant={isRunning ? "default" : "secondary"}>
          {isRunning ? "Running" : "Stopped"}
        </Badge>
        {isRunning && status?.pid && (
          <span className="text-xs text-muted-foreground">PID: {status.pid}</span>
        )}
        {isRunning && status?.startedAt && (
          <span className="text-xs text-muted-foreground">
            Started: {new Date(status.startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            size="sm"
            onClick={onStart}
            disabled={loading}
          >
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onRestart}
              disabled={loading}
            >
              <RotateCw className="mr-1 h-4 w-4" />
              Restart
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              disabled={loading}
            >
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
