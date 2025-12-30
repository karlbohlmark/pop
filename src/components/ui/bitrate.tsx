import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface BitRateProps {
  bitsPerSecond: number;
  direction?: "in" | "out";
  compact?: boolean;
  className?: string;
  showZero?: boolean;
}

/**
 * Formats bits per second into human-readable format
 * @param bps - bits per second
 * @param compact - use shorter unit names
 */
function formatBitRate(bps: number, compact: boolean = false): string {
  if (bps == null || isNaN(bps)) return compact ? "0" : "0 bps";
  if (bps === 0) return compact ? "0" : "0 bps";

  const units = compact
    ? ["bps", "Kbps", "Mbps", "Gbps", "Tbps"]
    : ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];

  let unitIndex = 0;
  let value = bps;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  // Format with appropriate decimal places
  const formatted = value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : value.toFixed(0);

  return `${formatted} ${units[unitIndex]}`;
}

/**
 * BitRate display component
 * Shows bitrate with optional direction indicator
 */
export function BitRate({
  bitsPerSecond,
  direction,
  compact = false,
  className,
  showZero = false,
}: BitRateProps) {
  if (bitsPerSecond === 0 && !showZero) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {direction === "in" && <ArrowDown className="inline h-3 w-3 mr-1" />}
        {direction === "out" && <ArrowUp className="inline h-3 w-3 mr-1" />}
        —
      </span>
    );
  }

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {direction === "in" && (
        <ArrowDown className="inline h-3 w-3 mr-1 text-blue-500" />
      )}
      {direction === "out" && (
        <ArrowUp className="inline h-3 w-3 mr-1 text-green-500" />
      )}
      {formatBitRate(bitsPerSecond, compact)}
    </span>
  );
}

/**
 * Displays both input and output bitrates side by side
 */
interface BitRatePairProps {
  inBitsPerSecond: number;
  outBitsPerSecond: number;
  compact?: boolean;
  className?: string;
}

export function BitRatePair({
  inBitsPerSecond,
  outBitsPerSecond,
  compact = false,
  className,
}: BitRatePairProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <BitRate bitsPerSecond={inBitsPerSecond} direction="in" compact={compact} showZero />
      <BitRate bitsPerSecond={outBitsPerSecond} direction="out" compact={compact} showZero />
    </span>
  );
}

// Export the formatter for use elsewhere
export { formatBitRate };
