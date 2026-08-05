import { cn } from "@/lib/cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-slate-500",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-r-blue-600"
      />

      <span>{label}</span>
    </span>
  );
}

export function LoadingPanel({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <Spinner label={label} />
    </div>
  );
}
