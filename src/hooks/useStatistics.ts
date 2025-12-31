import { useState, useEffect, useCallback, useRef } from "react";
import type { Statistics, DeltaStatistics, ChannelStats } from "@/lib/types";

export interface ChannelBitrates {
  channelId: number;
  inputBps: number;
  outputBps: number;
}

export interface StreamBitrate {
  streamId: number;
  bitsPerSecond: number;
}

export interface ChannelStreamBitrates {
  channelId: number;
  inputs: StreamBitrate[];
  outputs: StreamBitrate[];
}

export interface SystemBitrates {
  totalInputBps: number;
  totalOutputBps: number;
  channels: ChannelBitrates[];
  channelStreams: ChannelStreamBitrates[];
}

interface PreviousStats {
  timestamp: number;
  channels: Map<number, {
    inputs: Map<number, number>; // streamId -> bytes
    outputs: Map<number, number>;
  }>;
}

function calculateChannelBitrates(
  current: Statistics,
  previous: PreviousStats | null,
  currentTimestamp: number
): SystemBitrates {
  const result: SystemBitrates = {
    totalInputBps: 0,
    totalOutputBps: 0,
    channels: [],
    channelStreams: [],
  };

  if (!previous) {
    // First sample, return zeros
    for (const ch of current.channels) {
      result.channels.push({ channelId: ch.channelId, inputBps: 0, outputBps: 0 });
      result.channelStreams.push({
        channelId: ch.channelId,
        inputs: [],
        outputs: [],
      });
    }
    return result;
  }

  const timeDeltaSeconds = (currentTimestamp - previous.timestamp) / 1000;
  if (timeDeltaSeconds <= 0) return result;

  for (const ch of current.channels) {
    const prevCh = previous.channels.get(ch.channelId);
    let channelInputBps = 0;
    let channelOutputBps = 0;
    const inputBitrates: StreamBitrate[] = [];
    const outputBitrates: StreamBitrate[] = [];

    // Calculate input bitrates (RTP + RIST inputs)
    const allInputs = [...(ch.rtpInput ?? []), ...(ch.ristInput ?? [])];
    for (const input of allInputs) {
      const currentBytes = input.bytesReceived ?? 0;
      const prevBytes = prevCh?.inputs.get(input.streamId) ?? currentBytes;
      const bytesDelta = currentBytes - prevBytes;
      const bps = Math.max(0, (bytesDelta * 8) / timeDeltaSeconds);

      inputBitrates.push({ streamId: input.streamId, bitsPerSecond: bps });
      channelInputBps += bps;
    }

    // Calculate output bitrates (RTP + RIST outputs)
    const allOutputs = [...(ch.rtpOutput ?? []), ...(ch.ristOutput ?? [])];
    for (const output of allOutputs) {
      const currentBytes = output.bytesSent ?? 0;
      const prevBytes = prevCh?.outputs.get(output.streamId) ?? currentBytes;
      const bytesDelta = currentBytes - prevBytes;
      const bps = Math.max(0, (bytesDelta * 8) / timeDeltaSeconds);

      outputBitrates.push({ streamId: output.streamId, bitsPerSecond: bps });
      channelOutputBps += bps;
    }

    result.channels.push({
      channelId: ch.channelId,
      inputBps: channelInputBps,
      outputBps: channelOutputBps,
    });
    result.channelStreams.push({
      channelId: ch.channelId,
      inputs: inputBitrates,
      outputs: outputBitrates,
    });
    result.totalInputBps += channelInputBps;
    result.totalOutputBps += channelOutputBps;
  }

  return result;
}

function buildPreviousStats(stats: Statistics, timestamp: number): PreviousStats {
  const channels = new Map<number, { inputs: Map<number, number>; outputs: Map<number, number> }>();

  for (const ch of stats.channels) {
    const inputs = new Map<number, number>();
    const outputs = new Map<number, number>();

    for (const input of [...(ch.rtpInput ?? []), ...(ch.ristInput ?? [])]) {
      inputs.set(input.streamId, input.bytesReceived ?? 0);
    }
    for (const output of [...(ch.rtpOutput ?? []), ...(ch.ristOutput ?? [])]) {
      outputs.set(output.streamId, output.bytesSent ?? 0);
    }

    channels.set(ch.channelId, { inputs, outputs });
  }

  return { timestamp, channels };
}

export function useStatistics(pollInterval = 1000) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [delta, setDelta] = useState<DeltaStatistics | null>(null);
  const [bitrates, setBitrates] = useState<SystemBitrates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previousStatsRef = useRef<PreviousStats | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      const [statsRes, deltaRes] = await Promise.all([
        fetch("/api/monitoring/statistics"),
        fetch("/api/monitoring/delta"),
      ]);

      const statsData = await statsRes.json();
      const deltaData = await deltaRes.json();

      if (statsData.success) {
        const currentStats = statsData.data as Statistics;
        const currentTimestamp = Date.now();

        // Calculate bitrates from delta
        const calculatedBitrates = calculateChannelBitrates(
          currentStats,
          previousStatsRef.current,
          currentTimestamp
        );

        // Store current stats for next delta calculation
        previousStatsRef.current = buildPreviousStats(currentStats, currentTimestamp);

        setStatistics(currentStats);
        setBitrates(calculatedBitrates);
      }
      if (deltaData.success) {
        setDelta(deltaData.data);
      }
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatistics, pollInterval]);

  return { statistics, delta, bitrates, loading, error, refresh: fetchStatistics };
}
