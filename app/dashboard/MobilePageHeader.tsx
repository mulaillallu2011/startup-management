"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { name: "Users", href: "/dashboard/users" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default function MobilePageHeader() {
  const pathname = usePathname();

  const currentPage =
    pages.find((page) => {
      if (page.href === "/dashboard") {
        return pathname === "/dashboard";
      }

      return (
        pathname === page.href ||
        pathname.startsWith(`${page.href}/`)
      );
    }) || pages[0];

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:hidden sm:px-6">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link
          href="/dashboard"
          className="transition hover:text-blue-600"
        >
          Dashboard
        </Link>

        {currentPage.href !== "/dashboard" && (
          <>
            <span className="text-slate-300">/</span>

            <span className="truncate text-slate-500">
              {currentPage.name}
            </span>
          </>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {currentPage.name}
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage your {currentPage.name.toLowerCase()} here.
          </p>
        </div>

        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600 min-[400px]:flex">
          {currentPage.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}