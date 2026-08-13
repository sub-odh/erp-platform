import { Check, Circle } from "lucide-react";

import { getPasswordRequirements } from "@/lib/password-policy";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = getPasswordRequirements(password);

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
      {requirements.map((requirement) => (
        <div
          key={requirement.key}
          className={[
            "flex items-center gap-2 text-xs",
            requirement.satisfied ? "text-emerald-700" : "text-slate-500",
          ].join(" ")}
        >
          {requirement.satisfied ? (
            <Check size={14} strokeWidth={2.5} />
          ) : (
            <Circle size={11} strokeWidth={2} />
          )}

          <span>{requirement.label}</span>
        </div>
      ))}
    </div>
  );
}
