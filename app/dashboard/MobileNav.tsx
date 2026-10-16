"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "⌂" },
  { name: "Sales & Billing", href: "/dashboard/sales", icon: "₹" },
  { name: "Products", href: "/dashboard/products", icon: "▣" },
  { name: "Inventory", href: "/dashboard/inventory", icon: "▤" },
  { name: "Purchases", href: "/dashboard/purchases", icon: "↓" },
  { name: "Suppliers", href: "/dashboard/suppliers", icon: "◉" },
  { name: "Students", href: "/dashboard/students", icon: "♙" },
  { name: "Courses", href: "/dashboard/courses", icon: "▦" },
  { name: "Batches", href: "/dashboard/batches", icon: "◌" },
  { name: "Payments", href: "/dashboard/payments", icon: "₹" },
  { name: "Reports", href: "/dashboard/reports", icon: "▥" },
  { name: "Users", href: "/dashboard/users", icon: "👤" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {navigation.map((item, index) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-slate-800 text-slate-300 group-hover:scale-110 group-hover:bg-slate-700"
              }`}
            >
              {item.icon}
            </span>

            <span className="min-w-0 truncate">
              {item.name}
            </span>

            {isActive && (
              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-white animate-soft-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}