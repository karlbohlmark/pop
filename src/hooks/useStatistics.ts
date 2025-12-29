import { useState, useEffect, useCallback } from "react";
import type { Statistics, DeltaStatistics } from "@/lib/types";

export function useStatistics(pollInterval = 2000) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [delta, setDelta] = useState<DeltaStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      const [statsRes, deltaRes] = await Promise.all([
        fetch("/api/monitoring/statistics"),
        fetch("/api/monitoring/delta"),
      ]);

      const statsData = await statsRes.json();
      const deltaData = await deltaRes.json();

      if (statsData.success) {
        setStatistics(statsData.data);
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

  return { statistics, delta, loading, error, refresh: fetchStatistics };
}
