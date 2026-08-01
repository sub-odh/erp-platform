import { Building2, Package, ShoppingCart, Users } from "lucide-react";

const cards = [
  {
    label: "Organization",
    value: "Active",
    icon: Building2,
  },
  {
    label: "Users",
    value: "Managed",
    icon: Users,
  },
  {
    label: "Inventory",
    value: "Coming next",
    icon: Package,
  },
  {
    label: "Sales",
    value: "Planned",
    icon: ShoppingCart,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">Overview</p>

        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor your organization and ERP modules.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-500">{card.label}</p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
