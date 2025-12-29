import { useState, useEffect, useCallback } from "react";
import type { Channel, ChannelCreateParams, InputStream, OutputStream } from "@/lib/types";

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      if (data.success) {
        setChannels(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createChannel = useCallback(async (params: ChannelCreateParams) => {
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  const deleteChannel = useCallback(async (channelId: number) => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  const addInput = useCallback(async (channelId: number, input: InputStream) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  const addOutput = useCallback(async (channelId: number, output: OutputStream) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(output),
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  const removeInput = useCallback(async (channelId: number, streamId: number) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/inputs/${streamId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  const removeOutput = useCallback(async (channelId: number, streamId: number) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/outputs/${streamId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    loading,
    error,
    createChannel,
    deleteChannel,
    addInput,
    addOutput,
    removeInput,
    removeOutput,
    refresh: fetchChannels,
  };
}
