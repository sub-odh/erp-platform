"use client";

import { Network } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Spinner } from "@/components/ui";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import type { EmployeeDirectoryItem } from "@/types/employee";

interface HierarchyNode extends EmployeeDirectoryItem {
  children: HierarchyNode[];
}

export default function HierarchyPage() {
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Network size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600">Self Service</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Hierarchy
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Reporting tree from employee manager assignments.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No employees are available in the directory.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-4">
            {roots.map((node) => (
              <HierarchyBranch key={node.id} node={node} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HierarchyBranch({ node }: { node: HierarchyNode }) {
  return (
    <li>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {node.photoUrl ? (
            <AuthenticatedImage
              src={node.photoUrl}
              alt={employeeFullName(node)}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(node)
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{employeeFullName(node)}</p>
          <p className="text-xs text-slate-500">
            {[node.designation, node.department].filter(Boolean).join(" · ") ||
              node.employeeCode}
          </p>
        </div>
      </div>
      {node.children.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l border-slate-200 pl-6">
          {node.children.map((child) => (
            <HierarchyBranch key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function buildTree(items: EmployeeDirectoryItem[]): HierarchyNode[] {
  const nodes = new Map<string, HierarchyNode>(
    items.map((item) => [item.id, { ...item, children: [] }]),
  );
  const roots: HierarchyNode[] = [];

  for (const node of nodes.values()) {
    const manager = node.managerId ? nodes.get(node.managerId) : undefined;

    if (manager && manager.id !== node.id) {
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function initials(employee: EmployeeDirectoryItem) {
  return `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();
}
