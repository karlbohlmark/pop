// ============================================
// JSON-RPC 2.0 Types
// ============================================

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================
// Channel Types
// ============================================

export interface Channel {
  channelId: number;
  description: string;
  bufferDurationMs: number;
  inputs: InputStream[];
  outputs: OutputStream[];
}

export interface ChannelCreateParams {
  channelId: number;
  description: string;
  bufferDurationMs: number;
}

// ============================================
// Input Stream Types
// ============================================

export type InputStreamType =
  | "rtp"
  | "rist"
  | "rtp_generator"
  | "from_channel"
  | "sdi"
  | "generator";

export interface BaseInputStream {
  channelId: number;
  streamId: number;
  type: InputStreamType;
}

export interface RtpInputStream extends BaseInputStream {
  type: "rtp";
  localIp: string;
  localPort: number;
  multicastAddress?: string;
  useFec: boolean;
}

export interface RistInputStream extends BaseInputStream {
  type: "rist";
  tunnelId: number;
  localIp: string;
  localPort: number;
  useFec: boolean;
}

export interface RtpGeneratorInputStream extends BaseInputStream {
  type: "rtp_generator";
  targetBitrateBps?: number;
  packetSizeBytes?: number;
  generatePsi?: boolean;
  pmtPid?: number;
  videoPid?: number;
  psiIntervalPackets?: number;
}

export interface FromChannelInputStream extends BaseInputStream {
  type: "from_channel";
  sourceChannelId: number;
  pidRemap?: boolean;
}

export interface SdiInputStream extends BaseInputStream {
  type: "sdi";
  deviceIndex: number;
  displayMode: string;
  bitrate: number;
  keyframeInterval: number;
}

export interface GeneratorInputStream extends BaseInputStream {
  type: "generator";
  width?: number;
  height?: number;
  fpsNum?: number;
  fpsDen?: number;
  bitrate?: number;
  keyframeInterval?: number;
}

export type InputStream =
  | RtpInputStream
  | RistInputStream
  | RtpGeneratorInputStream
  | FromChannelInputStream
  | SdiInputStream
  | GeneratorInputStream;

// ============================================
// Output Stream Types
// ============================================

export type OutputStreamType = "rtp" | "rist" | "udp" | "sdi";

export interface BaseOutputStream {
  channelId: number;
  streamId: number;
  type: OutputStreamType;
}

export interface RtpOutputStream extends BaseOutputStream {
  type: "rtp";
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  delayMs: number;
}

export interface RistOutputStream extends BaseOutputStream {
  type: "rist";
  tunnelId?: number;
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  useOriginTiming: boolean;
}

export interface UdpOutputStream extends BaseOutputStream {
  type: "udp";
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  delayMs: number;
  packetFormat: "ts" | "rtp";
}

export interface SdiOutputStream extends BaseOutputStream {
  type: "sdi";
  deviceIndex: number;
  portIndex?: number;
  videoMode: string;
  pixelFormat: string;
}

export type OutputStream =
  | RtpOutputStream
  | RistOutputStream
  | UdpOutputStream
  | SdiOutputStream;

// ============================================
// Tunnel Types
// ============================================

export type TunnelAuthentication = "none" | "keepAlive";

export interface Tunnel {
  tunnelId: number;
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  secret: string;
  authentication: TunnelAuthentication;
}

export interface TunnelCreateParams {
  tunnelId: number;
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  secret: string;
  authentication: TunnelAuthentication;
}

// ============================================
// Statistics Types
// ============================================

export interface RistInputStats {
  streamId: number;
  packetsReceived: number;
  bytesReceived: number;
  retransmitPacketsReceived: number;
  retransmitBytesReceived: number;
  packetsLost: number;
  packetsDiscarded: number;
  packetsDropped: number;
  interarrivalJitter: number;
  roundtripMs: number;
  propagationDelayMs: number;
}

export interface RistOutputStats {
  streamId: number;
  packetsSent: number;
  bytesSent: number;
  retransmitPacketsSent: number;
  retransmitBytesSent: number;
}

export interface RtpInputStats {
  streamId: number;
  packetsReceived: number;
  bytesReceived: number;
  packetsLost: number;
}

export interface RtpOutputStats {
  streamId: number;
  packetsSent: number;
  bytesSent: number;
}

export interface ChannelStats {
  channelId: number;
  retransmitIntervalMs?: number;
  retransmitRoundtripMs?: number;
  ristInput: RistInputStats[];
  ristOutput: RistOutputStats[];
  rtpInput: RtpInputStats[];
  rtpOutput: RtpOutputStats[];
  udpInput: unknown[];
  udpOutput: unknown[];
  unixInput: unknown[];
  unixOutput: unknown[];
}

export interface TunnelRxStats {
  packets: number;
  bytes: number;
  fragments: number;
  keepAlivePackets: number;
  badAddress: number;
  bufferFull: number;
  cryptoFailure: number;
  socketError: number;
}

export interface TunnelTxStats {
  packets: number;
  bytes: number;
  notConnected: number;
  configurationError: number;
  socketError: number;
}

export interface TunnelStats {
  tunnelId: number;
  remoteEndpoint: string;
  status: string;
  rxBitsPerSecond: number;
  txBitsPerSecond: number;
  rx: TunnelRxStats;
  tx: TunnelTxStats;
}

export interface Statistics {
  deadlinesMissed: number;
  channels: ChannelStats[];
  tunnels: TunnelStats[];
}

export interface DeltaStatistics {
  longestWorkTimePerThread: number[];
  maxDelayedTimerPerThread: number[];
  ageOfOldestReorderHole: number;
  maxReorderTimePerChannel: number[];
}

// ============================================
// Status Types
// ============================================

export interface ZtvStatus {
  running: boolean;
  pid?: number;
  startedAt?: string;
}

export interface SdiDevice {
  index: number;
  name: string;
  displayModes: string[];
}

// ============================================
// Configuration Types
// ============================================

export interface SavedConfiguration {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  channels: Channel[];
  tunnels: Tunnel[];
  loggingLevel: LogLevel;
}

export type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "off";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// In-memory state tracking
// ============================================

export interface AppState {
  channels: Map<number, Channel>;
  tunnels: Map<number, Tunnel>;
  loggingLevel: LogLevel;
}
