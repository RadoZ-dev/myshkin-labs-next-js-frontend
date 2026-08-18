"use client";

import { useMemo } from "react";

interface Dot {
  x: number;
  y: number;
}

interface DotGridProps {
  dots: Dot[];
  dots2?: Dot[];
  width: number;
  height: number;
  centerY: number;
  animationKey: number;
  activeIndex?: number;
}

// Internal viewBox units. preserveAspectRatio="none" stretches this to the
// container, so no DOM measurement is needed.
const VB_WIDTH = 400;
const VB_HEIGHT = 140;
const PAD_X = 12;
const PAD_Y = 16;
const GRID_ROWS = 6;

export default function DotGrid({
  dots,
  dots2,
  animationKey,
  activeIndex,
  centerY,
}: DotGridProps) {
  const chartData = useMemo(() => {
    const sortedDots1 = [...dots].sort((a, b) => a.x - b.x);
    const sortedDots2 = dots2 ? [...dots2].sort((a, b) => a.x - b.x) : [];
    // Derive center of phrase 2 from its first dot (x=0 always starts at center)
    const center2 =
      sortedDots2.find((d) => d.x === 0)?.y ?? sortedDots2[0]?.y ?? 0;
    const mapped1 = sortedDots1.map((dot) => ({ v: centerY - dot.y }));
    const mapped2 = sortedDots2.map((dot) => ({ v: center2 - dot.y }));
    return [...mapped1, ...mapped2];
  }, [dots, dots2, centerY]);

  // Map pitch offsets into viewBox coordinates. The domain is symmetric around
  // zero so the centre line always reads as the root.
  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const maxAbs = Math.max(1, ...chartData.map((d) => Math.abs(d.v)));
    const usableW = VB_WIDTH - PAD_X * 2;
    const usableH = VB_HEIGHT - PAD_Y * 2;
    const step = chartData.length > 1 ? usableW / (chartData.length - 1) : 0;

    return chartData.map((d, i) => ({
      x: PAD_X + i * step,
      // +v is a higher pitch, which must render higher on screen
      y: PAD_Y + usableH / 2 - (d.v / maxAbs) * (usableH / 2),
    }));
  }, [chartData]);

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      // Remounting on regenerate restarts the draw-on animation
      key={animationKey}
      className="myshkin-labs-melodic-shapes__graph"
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Melodic contour"
    >
      {/* Horizontal grid */}
      {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => {
        const y = PAD_Y + ((VB_HEIGHT - PAD_Y * 2) / GRID_ROWS) * i;
        return (
          <line
            key={i}
            className="myshkin-labs-melodic-shapes__graph-grid"
            x1={PAD_X}
            y1={y}
            x2={VB_WIDTH - PAD_X}
            y2={y}
          />
        );
      })}

      {points.length > 1 && (
        <polyline
          className="myshkin-labs-melodic-shapes__graph-line"
          points={polyline}
        />
      )}

      {points.map((p, i) => (
        <circle
          key={i}
          className="myshkin-labs-melodic-shapes__graph-dot"
          cx={p.x}
          cy={p.y}
          r={i === activeIndex ? 6 : 5}
          data-root={i === 0 || undefined}
          data-active={i === activeIndex || undefined}
        />
      ))}
    </svg>
  );
}
