"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import type { DashboardChartPoint } from "@/types/dashboard";

export function DashboardBarChart({
  points,
  color,
  height,
}: {
  points: DashboardChartPoint[];
  color: string;
  height: number;
}) {
  return (
    <MeasuredChart height={height}>
      {(width) => {
        const chart = layoutBars(points, width, height);
        return (
          <svg width={width} height={height} className="block" role="img">
            {chart.grid.map((line) => (
              <g key={line.y}>
                <line
                  x1={chart.left}
                  x2={width - 8}
                  y1={line.y}
                  y2={line.y}
                  stroke="#eaecf4"
                />
                <text
                  x={chart.left - 8}
                  y={line.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  className="fill-slate-400"
                >
                  {line.label}
                </text>
              </g>
            ))}
            {chart.bars.map((bar) => (
              <rect
                key={bar.label}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx="4"
                fill={color}
              />
            ))}
            {chart.labels.map((label) => (
              <text
                key={label.text}
                x={label.x}
                y={height - 6}
                textAnchor="middle"
                fontSize="10"
                className="fill-slate-500"
              >
                {label.text}
              </text>
            ))}
          </svg>
        );
      }}
    </MeasuredChart>
  );
}

export function DashboardLineChart({
  points,
  height,
  type,
}: {
  points: DashboardChartPoint[];
  height: number;
  type: "line" | "bar";
}) {
  const color = "#0dcaf0";
  return (
    <MeasuredChart height={height}>
      {(width) => {
        const chart = layoutBars(points, width, height);
        const path = chart.bars
          .map((bar, index) => {
            const x = bar.x + bar.width / 2;
            const y = bar.y;
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        const area = chart.bars.length
          ? `${path} L ${chart.bars[chart.bars.length - 1].x + chart.bars[chart.bars.length - 1].width / 2} ${chart.plotBottom} L ${chart.bars[0].x + chart.bars[0].width / 2} ${chart.plotBottom} Z`
          : "";
        return (
          <svg width={width} height={height} className="block" role="img">
            {chart.grid.map((line) => (
              <line
                key={line.y}
                x1={chart.left}
                x2={width - 8}
                y1={line.y}
                y2={line.y}
                stroke="#eaecf4"
              />
            ))}
            {type === "bar"
              ? chart.bars.map((bar) => (
                  <rect
                    key={bar.label}
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    rx="4"
                    fill={color}
                  />
                ))
              : (
                  <>
                    <path d={area} fill="rgba(13, 202, 240, 0.12)" />
                    <path
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </>
                )}
            {chart.labels
              .filter((_, index) =>
                points.length > 14 ? index % Math.ceil(points.length / 8) === 0 : true,
              )
              .map((label) => (
                <text
                  key={`${label.text}-${label.x}`}
                  x={label.x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-slate-500"
                >
                  {label.text}
                </text>
              ))}
          </svg>
        );
      }}
    </MeasuredChart>
  );
}

export function DashboardDoughnut({
  achieved,
  remaining,
  height,
}: {
  achieved: number;
  remaining: number;
  height: number;
}) {
  const total = Math.max(achieved + remaining, 1);
  const achievedPct = achieved / total;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - achievedPct);
  return (
    <div className="flex h-full items-center justify-center" style={{ height }}>
      <svg width="160" height="160" viewBox="0 0 160 160" role="img">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#f1f3f5"
          strokeWidth="22"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#198754"
          strokeWidth="22"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
    </div>
  );
}

const PIE_COLORS = ["#2ecc71", "#3498db", "#f1c40f", "#e67e22"];

export function DashboardPieChart({
  points,
  height,
}: {
  points: DashboardChartPoint[];
  height: number;
}) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  let angle = -Math.PI / 2;
  const slices = points.map((point, index) => {
    const slice = total > 0 ? (point.value / total) * Math.PI * 2 : 0;
    const start = angle;
    const end = angle + slice;
    angle = end;
    const large = slice > Math.PI ? 1 : 0;
    const x1 = 80 + 62 * Math.cos(start);
    const y1 = 80 + 62 * Math.sin(start);
    const x2 = 80 + 62 * Math.cos(end);
    const y2 = 80 + 62 * Math.sin(end);
    return {
      ...point,
      color: PIE_COLORS[index % PIE_COLORS.length],
      d: `M 80 80 L ${x1} ${y1} A 62 62 0 ${large} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3" style={{ height }}>
      {total === 0 ? (
        <p className="text-sm text-slate-400">No billed sales this month.</p>
      ) : (
        <>
          <svg width="160" height="160" viewBox="0 0 160 160" role="img">
            {slices.map((slice) => (
              <path key={slice.label} d={slice.d} fill={slice.color} />
            ))}
          </svg>
          <div className="flex flex-wrap justify-center gap-3">
            {slices.map((slice) => (
              <span key={slice.label} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: slice.color }}
                />
                {slice.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MeasuredChart({
  height,
  children,
}: {
  height: number;
  children: (width: number) => ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = (): void => {
      setWidth(Math.max(1, Math.floor(host.getBoundingClientRect().width)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="w-full" style={{ height }}>
      {width > 0 ? children(width) : null}
    </div>
  );
}

function layoutBars(points: DashboardChartPoint[], width: number, height: number) {
  const left = 42;
  const top = 8;
  const plotBottom = height - 22;
  const plotHeight = Math.max(1, plotBottom - top);
  const max = Math.max(...points.map((point) => point.value), 1);
  const slot = points.length ? (width - left - 8) / points.length : 0;
  const barWidth = Math.max(4, slot * 0.55);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return {
    left,
    plotBottom,
    grid: ticks.map((tick) => ({
      y: top + plotHeight * (1 - tick),
      label: formatAxis(max * tick),
    })),
    bars: points.map((point, index) => {
      const heightValue = (point.value / max) * plotHeight;
      return {
        label: `${point.label}-${index}`,
        x: left + slot * index + (slot - barWidth) / 2,
        y: plotBottom - heightValue,
        width: barWidth,
        height: heightValue,
      };
    }),
    labels: points.map((point, index) => ({
      text: point.label,
      x: left + slot * index + slot / 2,
    })),
  };
}

function formatAxis(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}
