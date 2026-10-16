"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StockAlert = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

export default function NotificationMenu({
  alerts,
}: {
  alerts: StockAlert[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-notification-menu]")) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const alertCount = alerts.length;

  return (
    <div
      className="relative"
      data-notification-menu
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600"
      >
        🔔

        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[160] w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Notifications
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {alertCount === 0
                    ? "Everything looks good."
                    : `${alertCount} stock alert${
                        alertCount === 1 ? "" : "s"
                      }`}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  alertCount > 0
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {alertCount > 0 ? "Attention" : "All Clear"}
              </span>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-3">
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const outOfStock = alert.stock_quantity <= 0;

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-3 ${
                        outOfStock
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
                            outOfStock
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {outOfStock ? "!" : "⚠"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {alert.name}
                          </p>

                          <p
                            className={`mt-1 text-xs font-medium ${
                              outOfStock
                                ? "text-red-600"
                                : "text-amber-700"
                            }`}
                          >
                            {outOfStock
                              ? "Out of stock"
                              : `Only ${alert.stock_quantity} units left`}
                          </p>

                          {!outOfStock && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Minimum stock: {alert.minimum_stock}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
                  ✓
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No stock alerts
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your current inventory is within the configured limits.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <Link
              href="/dashboard/inventory"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Open Inventory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}