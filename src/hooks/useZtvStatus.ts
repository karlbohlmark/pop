import { useState, useEffect, useCallback } from "react";
import type { ZtvStatus } from "@/lib/types";

export function useZtvStatus(pollInterval = 3000) {
  const [status, setStatus] = useState<ZtvStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ztv/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
        setError(null);
      }
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ztv/start", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      await fetchStatus();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const stop = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ztv/stop", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      await fetchStatus();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const restart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ztv/restart", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      await fetchStatus();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  return { status, loading, error, start, stop, restart, refresh: fetchStatus };
}
