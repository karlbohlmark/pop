import type { FileSink } from "bun";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  ChannelCreateParams,
  TunnelCreateParams,
  RtpInputStream,
  RistInputStream,
  RtpGeneratorInputStream,
  FromChannelInputStream,
  SdiInputStream,
  GeneratorInputStream,
  RtpOutputStream,
  RistOutputStream,
  UdpOutputStream,
  SdiOutputStream,
  Statistics,
  DeltaStatistics,
  SdiDevice,
  LogLevel,
} from "./types";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: Timer;
}

export class JsonRpcClient {
  private requestId = 0;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  private buffer = "";
  private stdin: FileSink;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(
    stdin: FileSink,
    stdout: ReadableStream<Uint8Array>,
    private timeoutMs = 30000
  ) {
    this.stdin = stdin;
    this.startResponseListener(stdout);
  }

  private async startResponseListener(stdout: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stdout.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        this.buffer += this.decoder.decode(value, { stream: true });
        this.processBuffer();
      }
    } catch (error) {
      console.error("Error reading stdout:", error);
      this.rejectAllPending(new Error("stdout stream closed"));
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response: JsonRpcResponse = JSON.parse(line);
        this.handleResponse(response);
      } catch (error) {
        console.error("Failed to parse JSON-RPC response:", line, error);
      }
    }
  }

  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      console.warn("Received response for unknown request:", response.id);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(`${response.error.code}: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  async call<T>(method: string, params?: object): Promise<T> {
    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params: params as Record<string, unknown>,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.timeoutMs);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      const data = JSON.stringify(request) + "\n";
      try {
        this.stdin.write(this.encoder.encode(data));
        this.stdin.flush();
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  close(): void {
    this.rejectAllPending(new Error("Client closed"));
    this.stdin.end();
  }

  // ============================================
  // Channel Methods
  // ============================================

  async addChannel(params: ChannelCreateParams): Promise<{ status: string }> {
    return this.call("addChannel", params);
  }

  async removeChannel(channelId: number): Promise<{ status: string }> {
    return this.call("removeChannel", { channelId });
  }

  // ============================================
  // Input Stream Methods
  // ============================================

  async addInputStreamRtp(
    params: Omit<RtpInputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addInputStreamRtp", params);
  }

  async addInputStreamRist(
    params: Omit<RistInputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addInputStreamRist", params);
  }

  async addInputStreamRtpGenerator(
    params: Omit<RtpGeneratorInputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addInputStreamRtpGenerator", params);
  }

  async addInputStreamFromChannel(
    params: Omit<FromChannelInputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addInputStreamFromChannel", params);
  }

  async addSdiInput(
    params: Omit<SdiInputStream, "type" | "streamId">
  ): Promise<{ status: string }> {
    return this.call("addSdiInput", params);
  }

  async addGeneratorInput(
    params: Omit<GeneratorInputStream, "type" | "streamId">
  ): Promise<{ status: string }> {
    return this.call("addGeneratorInput", params);
  }

  // ============================================
  // Output Stream Methods
  // ============================================

  async addOutputStreamRtp(
    params: Omit<RtpOutputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addOutputStreamRtp", params);
  }

  async addOutputStreamRist(
    params: Omit<RistOutputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addOutputStreamRist", params);
  }

  async addOutputStreamUdp(
    params: Omit<UdpOutputStream, "type">
  ): Promise<{ status: string }> {
    return this.call("addOutputStreamUdp", params);
  }

  async addSdiOutput(
    params: Omit<SdiOutputStream, "type" | "streamId">
  ): Promise<{ status: string }> {
    return this.call("addSdiOutput", params);
  }

  async removeOutputStream(
    channelId: number,
    streamId: number
  ): Promise<{ status: string }> {
    return this.call("removeOutputStream", { channelId, streamId });
  }

  async removeInputStream(
    channelId: number,
    streamId: number
  ): Promise<{ status: string }> {
    return this.call("removeInputStream", { channelId, streamId });
  }

  // ============================================
  // Tunnel Methods
  // ============================================

  async addTunnelClient(params: TunnelCreateParams): Promise<{ status: string }> {
    return this.call("addTunnelClient", params);
  }

  async removeTunnel(tunnelId: number): Promise<{ status: string }> {
    return this.call("removeTunnel", { tunnelId });
  }

  // ============================================
  // Monitoring Methods
  // ============================================

  async statistics(): Promise<Statistics> {
    return this.call("statistics", {});
  }

  async deltaStatistics(): Promise<DeltaStatistics> {
    return this.call("deltaStatistics", {});
  }

  async status(): Promise<unknown> {
    return this.call("status", {});
  }

  async listSdiDevices(): Promise<SdiDevice[]> {
    return this.call("listSdiDevices", {});
  }

  // ============================================
  // System Methods
  // ============================================

  async setLoggingOptions(level: LogLevel): Promise<{ status: string }> {
    return this.call("setLoggingOptions", { level });
  }

  async shutdown(): Promise<{ status: string }> {
    return this.call("shutdown", {});
  }
}
