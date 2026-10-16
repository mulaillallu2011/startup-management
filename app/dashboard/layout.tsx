import { signOut } from "./actions";
import DashboardHeader from "./DashboardHeader";
import MobileNav from "./MobileNav";
import MobilePageHeader from "./MobilePageHeader";
import DashboardNav from "./DashboardNav";
import ScrollToTop from "./ScrollToTop";
import ScrollTopButton from "./ScrollTopButton";
import CommandMenu from "./CommandMenu";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock_quantity, minimum_stock")
    .eq("is_active", true);

  const stockAlerts =
    products?.filter((product) => {
      const stock = Number(product.stock_quantity ?? 0);
      const minimum = Number(product.minimum_stock ?? 0);

      return stock <= 0 || stock <= minimum;
    }) ?? [];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 animate-page-in">
      <ScrollToTop />

      <MobileNav />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-slate-950 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <Link href="/dashboard" className="group block">
              <h1 className="text-xl font-bold text-white transition duration-200 group-hover:translate-x-1">
                Startup Manager
              </h1>

              <p className="mt-1 text-xs text-slate-400 transition duration-200 group-hover:text-blue-400">
                Admin Panel
              </p>
            </Link>
          </div>

          <DashboardNav />

          <div className="border-t border-slate-800 p-4">
            <div className="account-card rounded-xl bg-slate-900 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {profile.full_name || "Administrator"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {user.email}
              </p>

              <form action={signOut} className="mt-3">
                <button
                  type="submit"
                  className="logout-button w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-red-600 hover:bg-red-600 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="w-full min-w-0 lg:pl-64">
       <DashboardHeader
  fullName={profile.full_name || "Administrator"}
  email={user.email || ""}
  alerts={stockAlerts}
/>

        <main className="dashboard-main min-h-screen w-full min-w-0 max-w-full overflow-x-hidden pt-[68px] lg:pt-0">
          <MobilePageHeader />

          {children}
        </main>
      </div>


      <ScrollTopButton />

      <CommandMenu />
    </div>
  );
}
