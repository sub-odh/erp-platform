import { redirect } from "next/navigation";

export default function LegacyOrganizationSettingsPage() {
  redirect("/settings/company");
}
