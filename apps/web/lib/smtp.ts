import { apiRequest } from "@/lib/api";
import type {
  SmtpConfiguration,
  UpdateSmtpConfigurationInput,
} from "@/types/smtp";

export function getSmtpConfiguration() {
  return apiRequest<SmtpConfiguration | null>("/smtp/current");
}

export function updateSmtpConfiguration(payload: UpdateSmtpConfigurationInput) {
  return apiRequest<SmtpConfiguration>("/smtp/current", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function testSmtpConfiguration() {
  return apiRequest<{ success: boolean; message: string }>(
    "/smtp/current/test",
    {
      method: "POST",
    },
  );
}
