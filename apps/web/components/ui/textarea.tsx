import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, label, error, hint, id, required, disabled, ...props },
    ref,
  ) {
    const textareaId =
      id ?? props.name ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return (
      <label htmlFor={textareaId} className="block">
        {label ? (
          <span className="mb-2 block text-sm font-medium text-slate-700">
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </span>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          className={cn(
            "min-h-28 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400 focus:ring-2",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-100",
            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            className,
          )}
          {...props}
        />

        {error ? (
          <span className="mt-1.5 block text-sm text-red-600">{error}</span>
        ) : hint ? (
          <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  },
);
