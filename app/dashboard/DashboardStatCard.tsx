"use client";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconClassName?: string;
  valueClassName?: string;
};

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  iconClassName = "bg-blue-50 text-blue-600",
  valueClassName = "text-slate-900",
}: DashboardStatCardProps) {
  return (
    <div className="dashboard-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition duration-300 group-hover:scale-125" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </p>

            <p
              className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${valueClassName}`}
            >
              {value}
            </p>

            {subtitle && (
              <p className="mt-2 text-xs font-medium text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm transition duration-200 group-hover:scale-110 ${iconClassName}`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}