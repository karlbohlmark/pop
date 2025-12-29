import { useState, useEffect, useCallback } from "react";
import type { Tunnel, TunnelCreateParams } from "@/lib/types";

export function useTunnels() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTunnels = useCallback(async () => {
    try {
      const res = await fetch("/api/tunnels");
      const data = await res.json();
      if (data.success) {
        setTunnels(data.data);
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

  const createTunnel = useCallback(async (params: TunnelCreateParams) => {
    try {
      const res = await fetch("/api/tunnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTunnels();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchTunnels]);

  const deleteTunnel = useCallback(async (tunnelId: number) => {
    try {
      const res = await fetch(`/api/tunnels/${tunnelId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchTunnels();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchTunnels]);

  useEffect(() => {
    fetchTunnels();
  }, [fetchTunnels]);

  return {
    tunnels,
    loading,
    error,
    createTunnel,
    deleteTunnel,
    refresh: fetchTunnels,
  };
}
