type FinanceItem = {
  title: string;
  value: number;
  icon: string;
  barClassName: string;
  valueClassName: string;
};

export default function DashboardFinanceChart({
  items,
}: {
  items: FinanceItem[];
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Analytics
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Financial Comparison
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Compare your current sales, purchases and fee collections.
          </p>
        </div>

        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:mt-0">
          Current totals
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {items.map((item) => {
          const percentage = Math.max(
            6,
            Math.round((item.value / maximum) * 100)
          );

          return (
            <div key={item.title}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${item.barClassName}`}
                  >
                    {item.icon}
                  </span>

                  <span className="truncate text-sm font-semibold text-slate-700">
                    {item.title}
                  </span>
                </div>

                <span
                  className={`shrink-0 text-sm font-bold ${item.valueClassName}`}
                >
                  ₹{item.value.toFixed(2)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.barClassName}`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}