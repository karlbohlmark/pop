import type { Subprocess } from "bun";
import { JsonRpcClient } from "./json-rpc-client";
import type {
  Channel,
  Tunnel,
  InputStream,
  OutputStream,
  LogLevel,
  AppState,
  Statistics,
  DeltaStatistics,
  SdiDevice,
  ChannelCreateParams,
  TunnelCreateParams,
} from "./types";

type ProcessEventType = "started" | "stopped" | "error" | "restarting";
type ProcessEventListener = (event: ProcessEventType, data?: unknown) => void;

class ZtvProcessManager {
  private process: Subprocess<"pipe", "pipe", "pipe"> | null = null;
  private client: JsonRpcClient | null = null;
  private ztvPath: string = "./ztv";
  private listeners: Set<ProcessEventListener> = new Set();
  private startedAt: Date | null = null;

  // In-memory state tracking
  private state: AppState = {
    channels: new Map(),
    tunnels: new Map(),
    loggingLevel: "debug",
  };

  async start(ztvPath?: string): Promise<void> {
    if (this.process && !this.process.killed) {
      throw new Error("ZTV process is already running");
    }

    if (ztvPath) {
      this.ztvPath = ztvPath;
    }

    try {
      // Use --workers 1 to run with a single worker thread
      // This ensures tunnels and channels are on the same worker
      // (required for RIST inputs to work with tunnel servers)
      this.process = Bun.spawn([this.ztvPath, "--workers", "1"], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      this.client = new JsonRpcClient(
        this.process.stdin,
        this.process.stdout
      );

      this.startedAt = new Date();

      // Handle process exit
      const currentProcess = this.process;
      this.process.exited.then((code) => {
        console.log(`ZTV process exited with code ${code}`);
        // Only clear state if this is still the current process
        // (prevents race condition during restart)
        if (this.process === currentProcess) {
          this.process = null;
          this.client = null;
          this.startedAt = null;
          this.emit("stopped", { code });
        }
      });

      // Log stderr
      this.handleStderr(this.process.stderr);

      this.emit("started");
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  private async handleStderr(stderr: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stderr.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.error("[ZTV]", decoder.decode(value));
      }
    } catch {
      // Stream closed
    }
  }

  async stop(): Promise<void> {
    if (!this.process || this.process.killed) {
      return;
    }

    const processToStop = this.process;

    try {
      // Try graceful shutdown first
      if (this.client) {
        await Promise.race([
          this.client.shutdown(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Shutdown timeout")), 5000)
          ),
        ]);
      }
    } catch (error) {
      console.warn("Graceful shutdown failed, killing process:", error);
    }

    // Force kill if still running
    if (processToStop && !processToStop.killed) {
      processToStop.kill();
    }

    // Wait for the process to actually exit to avoid race conditions
    // where the old exit handler clears state after a new process starts
    await processToStop.exited;

    // Clear state
    this.state.channels.clear();
    this.state.tunnels.clear();
    this.client = null;
    this.process = null;
    this.startedAt = null;
  }

  async restart(): Promise<void> {
    this.emit("restarting");
    await this.stop();
    await this.start();
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  getPid(): number | undefined {
    return this.process?.pid;
  }

  getStartedAt(): Date | null {
    return this.startedAt;
  }

  getClient(): JsonRpcClient {
    if (!this.client) {
      throw new Error("ZTV process is not running");
    }
    return this.client;
  }

  // Event handling
  on(listener: ProcessEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ProcessEventType, data?: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error("Event listener error:", error);
      }
    }
  }

  // ============================================
  // State Management
  // ============================================

  getState(): AppState {
    return this.state;
  }

  getChannels(): Channel[] {
    return Array.from(this.state.channels.values());
  }

  getChannel(channelId: number): Channel | undefined {
    return this.state.channels.get(channelId);
  }

  getTunnels(): Tunnel[] {
    return Array.from(this.state.tunnels.values());
  }

  getTunnel(tunnelId: number): Tunnel | undefined {
    return this.state.tunnels.get(tunnelId);
  }

  // ============================================
  // Channel Operations
  // ============================================

  async addChannel(params: ChannelCreateParams): Promise<void> {
    const client = this.getClient();
    await client.addChannel(params);

    const channel: Channel = {
      ...params,
      inputs: [],
      outputs: [],
    };
    this.state.channels.set(params.channelId, channel);
  }

  async removeChannel(channelId: number): Promise<void> {
    const client = this.getClient();
    await client.removeChannel(channelId);
    this.state.channels.delete(channelId);
  }

  // ============================================
  // Input Stream Operations
  // ============================================

  async addInput(channelId: number, input: InputStream): Promise<void> {
    const client = this.getClient();
    const channel = this.state.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    switch (input.type) {
      case "rtp":
        await client.addInputStreamRtp(input);
        break;
      case "rist":
        await client.addInputStreamRist(input);
        break;
      case "rtp_generator":
        await client.addInputStreamRtpGenerator(input);
        break;
      case "from_channel":
        await client.addInputStreamFromChannel(input);
        break;
      case "sdi":
        await client.addSdiInput(input);
        break;
      case "generator":
        await client.addGeneratorInput(input);
        break;
    }

    channel.inputs.push(input);
  }

  // ============================================
  // Output Stream Operations
  // ============================================

  async addOutput(channelId: number, output: OutputStream): Promise<void> {
    const client = this.getClient();
    const channel = this.state.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    switch (output.type) {
      case "rtp":
        await client.addOutputStreamRtp(output);
        break;
      case "rist":
        await client.addOutputStreamRist(output);
        break;
      case "udp":
        await client.addOutputStreamUdp(output);
        break;
      case "sdi":
        await client.addSdiOutput(output);
        break;
    }

    channel.outputs.push(output);
  }

  async removeOutput(channelId: number, streamId: number): Promise<void> {
    const client = this.getClient();
    const channel = this.state.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    await client.removeOutputStream(channelId, streamId);
    channel.outputs = channel.outputs.filter((o) => o.streamId !== streamId);
  }

  async removeInput(channelId: number, streamId: number): Promise<void> {
    const client = this.getClient();
    const channel = this.state.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    await client.removeInputStream(channelId, streamId);
    channel.inputs = channel.inputs.filter((i) => i.streamId !== streamId);
  }

  // ============================================
  // Tunnel Operations
  // ============================================

  async addTunnel(params: TunnelCreateParams): Promise<void> {
    const client = this.getClient();
    const { mode, ...rpcParams } = params;

    if (mode === "server") {
      await client.addTunnelServer(rpcParams);
    } else {
      await client.addTunnelClient(rpcParams);
    }

    const tunnel: Tunnel = { ...params };
    this.state.tunnels.set(params.tunnelId, tunnel);
  }

  async removeTunnel(tunnelId: number): Promise<void> {
    const client = this.getClient();
    await client.removeTunnel(tunnelId);
    this.state.tunnels.delete(tunnelId);
  }

  // ============================================
  // Monitoring Operations
  // ============================================

  async getStatistics(): Promise<Statistics> {
    const client = this.getClient();
    return client.statistics();
  }

  async getDeltaStatistics(): Promise<DeltaStatistics> {
    const client = this.getClient();
    return client.deltaStatistics();
  }

  async listSdiDevices(): Promise<SdiDevice[]> {
    const client = this.getClient();
    return client.listSdiDevices();
  }

  // ============================================
  // System Operations
  // ============================================

  async setLoggingLevel(level: LogLevel): Promise<void> {
    const client = this.getClient();
    await client.setLoggingOptions(level);
    this.state.loggingLevel = level;
  }

  getLoggingLevel(): LogLevel {
    return this.state.loggingLevel;
  }

  // ============================================
  // Configuration Import/Export
  // ============================================

  exportState(): { channels: Channel[]; tunnels: Tunnel[]; loggingLevel: LogLevel } {
    return {
      channels: this.getChannels(),
      tunnels: this.getTunnels(),
      loggingLevel: this.state.loggingLevel,
    };
  }

  async importState(state: {
    channels: Channel[];
    tunnels: Tunnel[];
    loggingLevel?: LogLevel;
  }): Promise<void> {
    // First add tunnels (they may be referenced by streams)
    for (const tunnel of state.tunnels) {
      await this.addTunnel(tunnel);
    }

    // Then add channels with their streams
    for (const channel of state.channels) {
      await this.addChannel({
        channelId: channel.channelId,
        description: channel.description,
        bufferDurationMs: channel.bufferDurationMs,
      });

      for (const input of channel.inputs) {
        await this.addInput(channel.channelId, input);
      }

      for (const output of channel.outputs) {
        await this.addOutput(channel.channelId, output);
      }
    }

    // Set logging level
    if (state.loggingLevel) {
      await this.setLoggingLevel(state.loggingLevel);
    }
  }

  async clearState(): Promise<void> {
    // Remove all channels (this will remove their streams)
    for (const channelId of this.state.channels.keys()) {
      await this.removeChannel(channelId);
    }

    // Remove all tunnels
    for (const tunnelId of this.state.tunnels.keys()) {
      await this.removeTunnel(tunnelId);
    }
  }
}

// Singleton instance
export const ztvManager = new ZtvProcessManager();
