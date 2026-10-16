"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    description: "Overview and statistics",
    icon: "⌂",
  },
  {
    name: "Sales & Billing",
    href: "/dashboard/sales",
    description: "Create and manage sales",
    icon: "₹",
  },
  {
    name: "Products",
    href: "/dashboard/products",
    description: "Manage products",
    icon: "▣",
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    description: "Track stock and adjustments",
    icon: "▤",
  },
  {
    name: "Purchases",
    href: "/dashboard/purchases",
    description: "Manage purchases",
    icon: "↓",
  },
  {
    name: "Suppliers",
    href: "/dashboard/suppliers",
    description: "Manage suppliers",
    icon: "◉",
  },
  {
    name: "Students",
    href: "/dashboard/students",
    description: "Manage students",
    icon: "♙",
  },
  {
    name: "Courses",
    href: "/dashboard/courses",
    description: "Manage courses",
    icon: "▦",
  },
  {
    name: "Batches",
    href: "/dashboard/batches",
    description: "Manage batches",
    icon: "◌",
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    description: "Track student payments",
    icon: "₹",
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    description: "Sales, purchases, payments, and financial reports",
    icon: "▥",
  },
  {
    name: "Users",
    href: "/dashboard/users",
    description: "Manage admin users",
    icon: "👤",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    description: "System settings",
    icon: "⚙",
  },
];

export default function CommandMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openMenu = () => {
    setSearch("");
    setSelectedIndex(0);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();
        openMenu();
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return navigation;
    }

    return navigation.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const navigateTo = (href: string) => {
    closeMenu();
    router.push(href);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (results.length > 0) {
        setSelectedIndex((current) =>
          current < results.length - 1 ? current + 1 : 0
        );
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (results.length > 0) {
        setSelectedIndex((current) =>
          current > 0 ? current - 1 : results.length - 1
        );
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedItem = results[selectedIndex];

      if (selectedItem) {
        navigateTo(selectedItem.href);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <>
      {/* Quick Navigation Button */}
      <button
        type="button"
        onClick={openMenu}
        className="fixed bottom-5 right-5 z-[70] flex h-12 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700 lg:bottom-6 lg:right-6"
        aria-label="Open quick navigation"
        title="Open Quick Navigation"
      >
        <span className="text-lg">⌕</span>

        <span className="hidden sm:inline">
          Quick Nav
        </span>

        <kbd className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/50 px-4 pt-[10vh] backdrop-blur-sm sm:pt-[12vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMenu();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg text-slate-400">
                  ⌕
                </span>

                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search dashboard pages..."
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500 sm:block">
                  ESC
                </kbd>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item, index) => {
                    const active =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                    const selected =
                      index === selectedIndex;

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onMouseEnter={() =>
                          setSelectedIndex(index)
                        }
                        onClick={() =>
                          navigateTo(item.href)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          selected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.icon}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {item.name}
                          </span>

                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {item.description}
                          </span>
                        </span>

                        <div className="flex shrink-0 items-center gap-2">
                          {active && (
                            <span className="text-xs font-semibold text-blue-600">
                              Current
                            </span>
                          )}

                          {selected && (
                            <span className="hidden text-[10px] font-bold text-slate-400 sm:inline">
                              Enter ↵
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <div className="text-3xl">⌕</div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No pages found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Try another search term.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  ↑ ↓ to navigate · Enter to open
                </span>

                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}