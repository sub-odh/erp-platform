"use client";

import { FileText, Minus, Plus, RefreshCw } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { getStoredUser } from "@/lib/auth";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import type { EmployeeDirectoryItem } from "@/types/employee";

interface HierarchyNode extends EmployeeDirectoryItem {
  children: HierarchyNode[];
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;

export default function HierarchyPage() {
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    setSelfUserId(getStoredUser()?.id ?? null);

    void getEmployeeDirectory()
      .then(setDirectory)
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the company hierarchy.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const roots = useMemo(() => buildTree(directory), [directory]);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.style.transform = `scale(${zoom})`;
    }
  }, [zoom]);

  function adjustZoom(delta: number) {
    setZoom((current) => {
      const next = Math.round((current + delta) * 10) / 10;

      return Math.min(Math.max(MIN_ZOOM, next), MAX_ZOOM);
    });
  }

  function resetZoom() {
    setZoom(1);
    containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  async function downloadPdf() {
    const element = treeRef.current;

    if (!element || downloading) {
      return;
    }

    setDownloading(true);
    const previousTransform = element.style.transform;
    element.style.transform = "scale(1)";

    try {
      const { default: html2pdf } = await import("html2pdf.js");

      await html2pdf()
        .set({
          margin: 0.5,
          filename: "Company_Hierarchy.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
        })
        .from(element)
        .save();
    } catch (downloadError: unknown) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download the hierarchy PDF.",
      );
    } finally {
      element.style.transform = previousTransform;
      setDownloading(false);
    }
  }

  function handlePointerDown(event: ReactMouseEvent<HTMLDivElement>) {
    const container = containerRef.current;

    if (!container || event.button !== 0) {
      return;
    }

    const drag = dragRef.current;
    drag.active = true;
    drag.startX = event.pageX - container.offsetLeft;
    drag.startY = event.pageY - container.offsetTop;
    drag.scrollLeft = container.scrollLeft;
    drag.scrollTop = container.scrollTop;
  }

  function handlePointerEnd() {
    dragRef.current.active = false;
  }

  function handlePointerMove(event: ReactMouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    const drag = dragRef.current;

    if (!container || !drag.active) {
      return;
    }

    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const y = event.pageY - container.offsetTop;
    container.scrollLeft = drag.scrollLeft - (x - drag.startX) * 2;
    container.scrollTop = drag.scrollTop - (y - drag.startY) * 2;
  }

  return (
    <div>
      <style>{hierarchyStyles}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-0 text-xl font-bold text-slate-900">
            Organizational Hierarchy
          </h1>
          <p className="text-sm text-slate-500">
            View and download the company structure.
          </p>
        </div>
        <div className="hierarchy-actions inline-flex shadow-sm">
          <button
            type="button"
            className="inline-flex items-center rounded-l border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            onClick={() => void downloadPdf()}
            disabled={downloading || loading}
          >
            <FileText size={14} className="mr-2 text-red-600" aria-hidden />
            Download PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-r border border-l-0 border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
            onClick={resetZoom}
          >
            <RefreshCw size={14} className="mr-2" aria-hidden />
            Reset View
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div
        ref={containerRef}
        id="zoomContainer"
        className="hierarchy-board relative h-[75vh] cursor-grab overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm active:cursor-grabbing"
        onMouseDown={handlePointerDown}
        onMouseLeave={handlePointerEnd}
        onMouseUp={handlePointerEnd}
        onMouseMove={handlePointerMove}
      >
        <div
          className="hierarchy-controls absolute bottom-5 right-5 z-[100] flex gap-2 rounded-lg border border-slate-300 bg-white p-2"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
            aria-label="Zoom in"
            onClick={() => adjustZoom(0.1)}
          >
            <Plus size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
            aria-label="Zoom out"
            onClick={() => adjustZoom(-0.1)}
          >
            <Minus size={14} aria-hidden />
          </button>
        </div>

        <div
          ref={treeRef}
          id="treeContent"
          className="hierarchy-tree"
        >
          {loading ? (
            <div className="p-5 text-center text-sm text-slate-500">
              Loading hierarchy...
            </div>
          ) : roots.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-500">
              No hierarchy data available.
            </div>
          ) : (
            <HierarchyLevel nodes={roots} selfUserId={selfUserId} />
          )}
        </div>
      </div>
    </div>
  );
}

function HierarchyLevel({
  nodes,
  selfUserId,
}: {
  nodes: HierarchyNode[];
  selfUserId: string | null;
}) {
  return (
    <ul>
      {nodes.map((node) => {
        const isSelf = node.userId !== null && node.userId === selfUserId;

        return (
          <li key={node.id}>
            <div className={isSelf ? "hierarchy-node hierarchy-node-self" : "hierarchy-node"}>
              <span className="hierarchy-name">{employeeFullName(node)}</span>
              <span className="hierarchy-role">{node.designation ?? ""}</span>
            </div>
            {node.children.length > 0 ? (
              <HierarchyLevel nodes={node.children} selfUserId={selfUserId} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function buildTree(
  elements: EmployeeDirectoryItem[],
  parentId: string | null = null,
  ancestors: ReadonlySet<string> = new Set(),
): HierarchyNode[] {
  const branch: HierarchyNode[] = [];

  for (const element of elements) {
    if ((element.managerId ?? null) !== parentId || ancestors.has(element.id)) {
      continue;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(element.id);
    branch.push({
      ...element,
      children: buildTree(elements, element.id, nextAncestors),
    });
  }

  return branch;
}

const hierarchyStyles = `
.hierarchy-tree {
  padding: 40px;
  transform-origin: top center;
  transition: transform 0.2s ease-out;
  display: inline-block;
  min-width: 100%;
}
.hierarchy-tree ul {
  margin: 0;
  padding-top: 20px;
  position: relative;
  display: flex;
  justify-content: center;
}
.hierarchy-tree li {
  text-align: center;
  list-style-type: none;
  position: relative;
  padding: 20px 5px 0 5px;
}
.hierarchy-tree li::before,
.hierarchy-tree li::after {
  content: "";
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 2px solid #cbd5e0;
  width: 50%;
  height: 20px;
}
.hierarchy-tree li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid #cbd5e0;
}
.hierarchy-tree li:only-child::after,
.hierarchy-tree li:only-child::before {
  display: none;
}
.hierarchy-tree li:only-child {
  padding-top: 0;
}
.hierarchy-tree li:first-child::before,
.hierarchy-tree li:last-child::after {
  border: 0 none;
}
.hierarchy-tree li:last-child::before {
  border-right: 2px solid #cbd5e0;
  border-radius: 0 5px 0 0;
}
.hierarchy-tree li:first-child::after {
  border-radius: 5px 0 0 0;
}
.hierarchy-tree ul ul::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 2px solid #cbd5e0;
  width: 0;
  height: 20px;
}
.hierarchy-node {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 10px 15px;
  display: inline-block;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  min-width: 140px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}
.hierarchy-node-self {
  background: #6366f1;
  border-color: #4338ca;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
  transform: scale(1.05);
}
.hierarchy-name {
  font-weight: 700;
  font-size: 0.85rem;
  display: block;
  color: #1e293b;
}
.hierarchy-role {
  font-size: 0.7rem;
  color: #6366f1;
  font-weight: 600;
  text-transform: uppercase;
}
.hierarchy-node-self .hierarchy-name {
  color: #ffffff;
}
.hierarchy-node-self .hierarchy-role {
  color: #e0e7ff;
}
@media print {
  .hierarchy-controls,
  .hierarchy-actions {
    display: none !important;
  }
  .hierarchy-board {
    height: auto !important;
    overflow: visible !important;
    border: none !important;
  }
}
`;
