"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { SalesOrderReportMonth } from "@/types/sales-orders";

const SALES_COLOR = "#1cc88a";
const WON_COLOR = "#4e73df";
const CHART_HEIGHT = 350;

export function SalesTrendChart({
  months,
}: {
  months: SalesOrderReportMonth[];
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

  const chart = useMemo(
    () => buildChart(months, width, CHART_HEIGHT),
    [months, width],
  );

  return (
    <div className="min-w-0 w-full">
      <div ref={hostRef} className="h-[350px] w-full">
        {width > 0 ? (
          <svg
            width={width}
            height={CHART_HEIGHT}
            className="block"
            role="img"
            aria-label="Sales order value compared with won CRM deals"
          >
            {chart.gridY.map((line) => (
              <g key={line.y}>
                <line
                  x1={chart.plotLeft}
                  x2={width - chart.paddingRight}
                  y1={line.y}
                  y2={line.y}
                  stroke="#eaecf4"
                  strokeWidth="1"
                />
                <text
                  x={chart.plotLeft - 10}
                  y={line.y + 4}
                  textAnchor="end"
                  className="fill-slate-400"
                  fontSize="11"
                >
                  {line.label}
                </text>
              </g>
            ))}
            <path d={chart.salesArea} fill="rgba(28, 200, 138, 0.08)" />
            <path
              d={chart.salesPath}
              fill="none"
              stroke={SALES_COLOR}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={chart.wonPath}
              fill="none"
              stroke={WON_COLOR}
              strokeWidth="3"
              strokeDasharray="5 5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {chart.points.map((point) => (
              <g key={point.key}>
                <circle
                  cx={point.x}
                  cy={point.salesY}
                  r="4"
                  fill={SALES_COLOR}
                />
                <circle
                  cx={point.x}
                  cy={point.wonY}
                  r="4"
                  fill="white"
                  stroke={WON_COLOR}
                  strokeWidth="2"
                />
                {point.showLabel ? (
                  <text
                    x={point.x}
                    y={CHART_HEIGHT - 14}
                    textAnchor="middle"
                    className="fill-slate-500"
                    fontSize="11"
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
        <LegendSwatch color={SALES_COLOR} label="Actual Sales Order Value" />
        <LegendSwatch color={WON_COLOR} dashed label="Won Deals (CRM)" />
      </div>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-4 w-7 rounded-sm"
        style={{
          border: dashed ? `2px dashed ${color}` : `2px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}

function buildChart(
  months: SalesOrderReportMonth[],
  width: number,
  height: number,
) {
  const paddingLeft = 64;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 40;
  const plotLeft = paddingLeft;
  const plotWidth = Math.max(1, width - paddingLeft - paddingRight);
  const plotHeight = height - paddingTop - paddingBottom;
  const plotBottom = paddingTop + plotHeight;
  const maxValue = Math.max(
    1,
    ...months.flatMap((month) => [month.salesOrderValue, month.wonDealValue]),
  );
  const niceMax = niceCeiling(maxValue);
  const ticks = 5;
  const gridY = Array.from({ length: ticks + 1 }, (_, index) => {
    const ratio = index / ticks;
    return {
      y: paddingTop + plotHeight * (1 - ratio),
      label: formatAxis(niceMax * ratio),
    };
  });
  const step = months.length > 1 ? plotWidth / (months.length - 1) : plotWidth;
  const labelEvery = width < 640 ? 2 : 1;
  const points = months.map((month, index) => {
    const x = plotLeft + index * step;
    return {
      key: month.key,
      label: month.label.slice(0, 3),
      showLabel: index % labelEvery === 0 || index === months.length - 1,
      x,
      salesY: paddingTop + plotHeight * (1 - month.salesOrderValue / niceMax),
      wonY: paddingTop + plotHeight * (1 - month.wonDealValue / niceMax),
    };
  });
  const salesCoords = points.map((point) => ({ x: point.x, y: point.salesY }));
  const wonCoords = points.map((point) => ({ x: point.x, y: point.wonY }));
  const salesPath = smoothPath(salesCoords);
  const first = points[0];
  const last = points[points.length - 1];
  const salesArea =
    first && last
      ? `${salesPath} L ${last.x} ${plotBottom} L ${first.x} ${plotBottom} Z`
      : "";

  return {
    paddingRight,
    plotLeft,
    gridY,
    points,
    salesPath,
    wonPath: smoothPath(wonCoords),
    salesArea,
  };
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const delta = (next.x - current.x) * 0.3;
    path += ` C ${current.x + delta} ${current.y}, ${next.x - delta} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function niceCeiling(value: number): number {
  if (value <= 1) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatAxis(value: number): string {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000)
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  if (value === 0 || Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}
