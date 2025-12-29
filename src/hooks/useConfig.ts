import { useState, useEffect, useCallback } from "react";
import type { SavedConfiguration, LogLevel } from "@/lib/types";

export function useConfig() {
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([]);
  const [loggingLevel, setLoggingLevel] = useState<LogLevel>("debug");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success) {
        setConfigurations(data.data);
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

  const fetchLoggingLevel = useCallback(async () => {
    try {
      const res = await fetch("/api/logging");
      const data = await res.json();
      if (data.success) {
        setLoggingLevel(data.data.level);
      }
    } catch (err) {
      // Ignore logging level fetch errors
    }
  }, []);

  const saveConfiguration = useCallback(async (name: string, description?: string) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchConfigurations();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchConfigurations]);

  const loadConfiguration = useCallback(async (configId: string) => {
    try {
      const res = await fetch(`/api/config/${configId}/load`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  const deleteConfiguration = useCallback(async (configId: string) => {
    try {
      const res = await fetch(`/api/config/${configId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchConfigurations();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [fetchConfigurations]);

  const updateLoggingLevel = useCallback(async (level: LogLevel) => {
    try {
      const res = await fetch("/api/logging", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      if (data.success) {
        setLoggingLevel(level);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  useEffect(() => {
    fetchConfigurations();
    fetchLoggingLevel();
  }, [fetchConfigurations, fetchLoggingLevel]);

  return {
    configurations,
    loggingLevel,
    loading,
    error,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    updateLoggingLevel,
    refresh: fetchConfigurations,
  };
}
