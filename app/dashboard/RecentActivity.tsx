type Activity = {
  id: string;
  type: "sale" | "purchase" | "payment" | "student";
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
};

type RecentActivityProps = {
  activities: Activity[];
};

const activityStyles = {
  sale: {
    icon: "₹",
    iconClass: "bg-blue-50 text-blue-600",
    label: "Sale",
  },
  purchase: {
    icon: "↓",
    iconClass: "bg-violet-50 text-violet-600",
    label: "Purchase",
  },
  payment: {
    icon: "₹",
    iconClass: "bg-emerald-50 text-emerald-600",
    label: "Payment",
  },
  student: {
    icon: "♙",
    iconClass: "bg-amber-50 text-amber-600",
    label: "Student",
  },
} as const;

function formatAmount(amount?: number) {
  if (amount === undefined) {
    return null;
  }

  return `₹${amount.toFixed(2)}`;
}

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Unknown time";
  }

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Activity
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Recent Activity
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Latest activity across your startup.
          </p>
        </div>

        <span className="hidden rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:block">
          Latest
        </span>
      </div>

      <div className="mt-6">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const style = activityStyles[activity.type];
              const amount = formatAmount(activity.amount);

              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="animate-card-in flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition duration-200 hover:border-slate-200 hover:bg-slate-50"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${style.iconClass}`}
                  >
                    {style.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {activity.title}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {activity.description}
                        </p>
                      </div>

                      {amount && (
                        <span className="shrink-0 text-sm font-bold text-slate-900">
                          {amount}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {style.label}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
              ◌
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No recent activity
            </p>

            <p className="mt-1 text-xs text-slate-400">
              New sales, purchases and payments will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
