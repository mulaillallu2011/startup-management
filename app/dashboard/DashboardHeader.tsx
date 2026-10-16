"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "./actions";
import NotificationMenu from "./NotificationMenu";

const pages = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Sales & Billing", href: "/dashboard/sales" },
  { name: "Products", href: "/dashboard/products" },
  { name: "Inventory", href: "/dashboard/inventory" },
  { name: "Purchases", href: "/dashboard/purchases" },
  { name: "Suppliers", href: "/dashboard/suppliers" },
  { name: "Students", href: "/dashboard/students" },
  { name: "Courses", href: "/dashboard/courses" },
  { name: "Batches", href: "/dashboard/batches" },
  { name: "Payments", href: "/dashboard/payments" },
  { name: "Reports", href: "/dashboard/reports" },
  { name: "Users", href: "/dashboard/users" },
  { name: "Settings", href: "/dashboard/settings" },
];

type StockAlert = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

type DashboardHeaderProps = {
  fullName?: string | null;
  email?: string | null;
  alerts: StockAlert[];
};

export default function DashboardHeader({
  fullName,
  email,
  alerts,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [lastRefreshed, setLastRefreshed] =
    useState<Date | null>(null);

  const safeFullName = String(fullName ?? "").trim();
  const safeEmail = String(email ?? "").trim();

  const displayName = safeFullName || "Administrator";

  const currentPage = useMemo(() => {
    return (
      pages.find((page) => {
        if (page.href === "/dashboard") {
          return pathname === "/dashboard";
        }

        return (
          pathname === page.href ||
          pathname.startsWith(`${page.href}/`)
        );
      }) || pages[0]
    );
  }, [pathname]);

  const initials = useMemo(() => {
    const name = safeFullName;

    if (!name) {
      return "A";
    }

    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [safeFullName]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };

    const updateConnection = () => {
      setIsOnline(navigator.onLine);
    };

    updateClock();
    updateConnection();

    const interval = window.setInterval(updateClock, 1000);

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-profile-menu]")) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [profileOpen]);

  const handleRefresh = () => {
    startRefresh(() => {
      router.refresh();
      setLastRefreshed(new Date());
    });
  };

  return (
    <header className="sticky top-0 z-30 hidden w-full min-w-0 border-b border-slate-200 bg-white/95 backdrop-blur lg:block">
      <div className="flex min-h-16 w-full min-w-0 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Current Page */}
        <div className="header-enter min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-400">
            <Link
              href="/dashboard"
              className="shrink-0 transition hover:text-blue-600"
            >
              Dashboard
            </Link>

            {currentPage.href !== "/dashboard" && (
              <>
                <span className="shrink-0 text-slate-300">
                  /
                </span>

                <span className="min-w-0 truncate text-slate-500">
                  {currentPage.name}
                </span>
              </>
            )}
          </div>

          <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
            {currentPage.name}
          </h2>
        </div>

        {/* Center Controls */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          {/* Refresh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  isRefreshing ? "animate-spin" : ""
                }
                aria-hidden="true"
              >
                ↻
              </span>
            </button>

            <div className="hidden min-w-[82px] 2xl:block">
              <p
                className={`truncate text-[10px] font-semibold ${
                  isRefreshing
                    ? "text-blue-600"
                    : "text-slate-400"
                }`}
              >
                {isRefreshing
                  ? "Refreshing..."
                  : lastRefreshed
                    ? `Updated ${lastRefreshed.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`
                    : "Ready"}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <NotificationMenu alerts={alerts} />

          {/* Connection */}
          <div
            className={`hidden items-center gap-2 rounded-xl border px-3 py-2 2xl:flex ${
              isOnline
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline
                  ? "animate-soft-pulse bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            <span
              className={`text-xs font-semibold ${
                isOnline
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Date & Time */}
          <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right 2xl:block">
            <p className="text-sm font-semibold text-slate-800">
              {currentTime || "--:--:--"}
            </p>

            <p className="max-w-[170px] truncate text-xs text-slate-500">
              {currentDate || "Loading date..."}
            </p>
          </div>
        </div>

        {/* Profile */}
        <div
          className="user-header-enter relative shrink-0"
          data-profile-menu
        >
          <button
            type="button"
            onClick={() =>
              setProfileOpen((value) => !value)
            }
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              {initials}
            </div>

            <div className="hidden min-w-0 max-w-[160px] text-right xl:block">
              <p className="truncate text-sm font-semibold text-slate-900">
                {displayName}
              </p>

              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  Admin
                </span>

                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </div>

            <span
              className={`text-xs text-slate-400 transition ${
                profileOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+10px)] z-[150] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              role="menu"
            >
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {displayName}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {safeEmail || "Email unavailable"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Role
                    </span>

                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
                      Administrator
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Connection
                    </span>

                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        isOnline
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOnline
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />

                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <form action={signOut} className="mt-3">
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}