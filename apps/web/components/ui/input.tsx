import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    error,
    hint,
    leadingIcon,
    id,
    required,
    disabled,
    ...props
  },
  ref,
) {
  const inputId =
    id ?? props.name ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <label htmlFor={inputId} className="block">
      {label ? (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}

          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </span>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-white px-3 transition",
          "focus-within:ring-2",
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
            : "border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-100",
          disabled && "cursor-not-allowed bg-slate-100",
        )}
      >
        {leadingIcon ? (
          <span className="shrink-0 text-slate-400">{leadingIcon}</span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full border-0 bg-transparent py-2.5 text-sm text-slate-900 outline-none",
            "placeholder:text-slate-400",
            "disabled:cursor-not-allowed disabled:text-slate-500",
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <span className="mt-1.5 block text-sm text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
});
