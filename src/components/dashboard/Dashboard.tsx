import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStatistics } from "@/hooks/useStatistics";
import { useChannels } from "@/hooks/useChannels";
import { useTunnels } from "@/hooks/useTunnels";
import { useZtvStatus } from "@/hooks/useZtvStatus";
import { Tv2, Cable, Activity, AlertCircle } from "lucide-react";

export function Dashboard() {
  const { status } = useZtvStatus();
  const { statistics, loading: statsLoading, error: statsError } = useStatistics();
  const { channels } = useChannels();
  const { tunnels } = useTunnels();

  const isRunning = status?.running ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your ZTV media streaming configuration
        </p>
      </div>

      {!isRunning && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              ZTV process is not running. Start it to enable streaming and monitoring.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <Tv2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-muted-foreground">
              {channels.reduce((acc, c) => acc + c.inputs.length, 0)} inputs,{" "}
              {channels.reduce((acc, c) => acc + c.outputs.length, 0)} outputs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tunnels</CardTitle>
            <Cable className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tunnels.length}</div>
            <p className="text-xs text-muted-foreground">
              RIST tunnel connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deadlines Missed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.deadlinesMissed ?? "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Timing deadline misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${isRunning ? "bg-green-500" : "bg-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isRunning ? "Online" : "Offline"}</div>
            <p className="text-xs text-muted-foreground">
              {isRunning && status?.pid ? `PID ${status.pid}` : "Process not running"}
            </p>
          </CardContent>
        </Card>
      </div>

      {isRunning && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Channel Statistics</CardTitle>
                <CardDescription>Real-time stream statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : statsError ? (
                  <p className="text-sm text-red-500">{statsError}</p>
                ) : statistics?.channels && statistics.channels.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.channels.map((ch) => (
                      <div key={ch.channelId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Channel {ch.channelId}</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>RTP Inputs: {ch.rtpInput.length}</div>
                          <div>RTP Outputs: {ch.rtpOutput.length}</div>
                          <div>RIST Inputs: {ch.ristInput.length}</div>
                          <div>RIST Outputs: {ch.ristOutput.length}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No channel statistics available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tunnel Statistics</CardTitle>
                <CardDescription>RIST tunnel status</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : statistics?.tunnels && statistics.tunnels.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.tunnels.map((t) => (
                      <div key={t.tunnelId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Tunnel {t.tunnelId}</span>
                          <Badge variant={t.status === "connected" ? "default" : "secondary"}>
                            {t.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>Remote: {t.remoteEndpoint}</div>
                          <div>RX: {(t.rxBitsPerSecond / 1000000).toFixed(2)} Mbps</div>
                          <div>TX: {(t.txBitsPerSecond / 1000000).toFixed(2)} Mbps</div>
                          <div>Packets: {t.rx.packets} / {t.tx.packets}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tunnel statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configured Channels</CardTitle>
          <CardDescription>Quick overview of all channels</CardDescription>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No channels configured. Go to Channels to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.channelId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      Channel {channel.channelId}: {channel.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Buffer: {channel.bufferDurationMs}ms |{" "}
                      {channel.inputs.length} input(s), {channel.outputs.length} output(s)
                    </div>
                  </div>
                  <Badge variant="outline">
                    {channel.inputs.length > 0 ? "Configured" : "No inputs"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
