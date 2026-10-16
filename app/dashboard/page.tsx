import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardStatCard from "./DashboardStatCard";
import DashboardFinanceChart from "./DashboardFinanceChart";
import RecentActivity from "./RecentActivity";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    productsResult,
    studentsResult,
    coursesResult,
    batchesResult,
    salesResult,
    purchasesResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, stock_quantity, minimum_stock, is_active"),

    supabase
      .from("students")
      .select("id, is_active, created_at"),

    supabase
      .from("courses")
      .select("id, is_active"),

    supabase
      .from("batches")
      .select("id, status"),

    supabase
      .from("sales")
      .select("id, total_amount, payment_status, created_at"),

    supabase
      .from("purchases")
      .select("id, total_amount, created_at"),

    supabase
      .from("payments")
      .select("id, amount, payment_status, created_at"),
  ]);

  const products = productsResult.data ?? [];
  const students = studentsResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const batches = batchesResult.data ?? [];
  const sales = salesResult.data ?? [];
  const purchases = purchasesResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  const lowStock = products.filter(
    (product) =>
      product.is_active &&
      product.stock_quantity <= product.minimum_stock
  ).length;

  const activeStudents = students.filter(
    (student) => student.is_active
  ).length;

  const activeCourses = courses.filter(
    (course) => course.is_active
  ).length;

  const activeBatches = batches.filter(
    (batch) => batch.status === "active"
  ).length;

  const upcomingBatches = batches.filter(
    (batch) => batch.status === "upcoming"
  ).length;

  const totalSales = sales
    .filter((sale) => sale.payment_status !== "cancelled")
    .reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0
    );

  const totalPurchases = purchases.reduce(
    (sum, purchase) =>
      sum + Number(purchase.total_amount),
    0
  );

  const totalPaid = payments
    .filter(
      (payment) => payment.payment_status === "paid"
    )
    .reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

  const pendingPayments = payments
    .filter(
      (payment) => payment.payment_status === "pending"
    )
    .reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

  const activities = [
    ...sales.map((sale) => ({
      id: sale.id,
      type: "sale" as const,
      title: "Sale recorded",
      description:
        sale.payment_status === "paid"
          ? "Payment completed"
          : `Payment status: ${sale.payment_status}`,
      amount: Number(sale.total_amount),
      createdAt: sale.created_at,
    })),

    ...purchases.map((purchase) => ({
      id: purchase.id,
      type: "purchase" as const,
      title: "Purchase recorded",
      description: "Supplier purchase added",
      amount: Number(purchase.total_amount),
      createdAt: purchase.created_at,
    })),

    ...payments.map((payment) => ({
      id: payment.id,
      type: "payment" as const,
      title: "Payment recorded",
      description: `Payment status: ${payment.payment_status}`,
      amount: Number(payment.amount),
      createdAt: payment.created_at,
    })),

    ...students.map((student) => ({
      id: student.id,
      type: "student" as const,
      title: "Student registered",
      description: student.is_active
        ? "Active student"
        : "Inactive student",
      createdAt: student.created_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  const stats = [
    {
      title: "Active Products",
      value: String(activeProducts),
      subtitle: `${lowStock} low stock`,
      href: "/dashboard/products",
      icon: "▣",
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      title: "Students",
      value: String(activeStudents),
      subtitle: `${activeCourses} active courses`,
      href: "/dashboard/students",
      icon: "♙",
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Active Batches",
      value: String(activeBatches),
      subtitle: `${upcomingBatches} upcoming`,
      href: "/dashboard/batches",
      icon: "◌",
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      title: "Paid Fees",
      value: `₹${totalPaid.toFixed(2)}`,
      subtitle: `₹${pendingPayments.toFixed(2)} pending`,
      href: "/dashboard/payments",
      icon: "₹",
      iconClassName: "bg-amber-50 text-amber-600",
    },
  ];

  const finance = [
    {
      title: "Total Sales",
      value: totalSales,
      href: "/dashboard/sales",
    },
    {
      title: "Total Purchases",
      value: totalPurchases,
      href: "/dashboard/purchases",
    },
    {
      title: "Fee Collections",
      value: totalPaid,
      href: "/dashboard/payments",
    },
  ];

  const quickActions = [
    {
      title: "New Sale",
      description: "Create an invoice",
      href: "/dashboard/sales",
      icon: "₹",
    },
    {
      title: "New Purchase",
      description: "Record supplier purchase",
      href: "/dashboard/purchases",
      icon: "↓",
    },
    {
      title: "Add Student",
      description: "Register a student",
      href: "/dashboard/students",
      icon: "♙",
    },
    {
      title: "Record Payment",
      description: "Collect course fees",
      href: "/dashboard/payments",
      icon: "₹",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 animate-card-in">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
          Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Overview of your startup operations.
        </p>
      </div>

      {/* Main Statistics */}
      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="animate-card-in block rounded-2xl"
              style={{
                animationDelay: `${index * 70}ms`,
              }}
            >
              <DashboardStatCard
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                iconClassName={stat.iconClassName}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Financial Overview */}
      <section className="mt-10">
        <div className="mb-4 animate-card-in">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Finance
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Financial Overview
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {finance.map((item, index) => (
            <FinanceCard
              key={item.title}
              {...item}
              delay={300 + index * 70}
            />
          ))}
        </div>
      </section>

      {/* Financial Analytics */}
      <section className="mt-10">
        <div className="animate-card-in">
          <DashboardFinanceChart
            items={[
              {
                title: "Total Sales",
                value: totalSales,
                icon: "₹",
                barClassName: "bg-blue-500 text-blue-600",
                valueClassName: "text-blue-700",
              },
              {
                title: "Total Purchases",
                value: totalPurchases,
                icon: "↓",
                barClassName: "bg-violet-500 text-violet-600",
                valueClassName: "text-violet-700",
              },
              {
                title: "Fee Collections",
                value: totalPaid,
                icon: "₹",
                barClassName: "bg-emerald-500 text-emerald-600",
                valueClassName: "text-emerald-700",
              },
            ]}
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mt-10">
        <RecentActivity activities={activities} />
      </section>

      {/* Quick Actions */}
      <section className="mt-10">
        <div className="mb-4 animate-card-in">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Shortcuts
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Quick Actions
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <QuickAction
              key={action.title}
              {...action}
              delay={550 + index * 70}
            />
          ))}
        </div>
      </section>

      {/* Operations */}
      <section className="mt-10 pb-8">
        <div className="mb-4 animate-card-in">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Operations
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Operations
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <OperationCard
            title="Inventory"
            value={`${lowStock} low-stock products`}
            description="Review stock levels and adjustments."
            href="/dashboard/inventory"
            delay={850}
          />

          <OperationCard
            title="Training"
            value={`${activeStudents} active students`}
            description={`${activeBatches} active batches across ${activeCourses} courses.`}
            href="/dashboard/batches"
            delay={920}
          />
        </div>
      </section>
    </div>
  );
}

function FinanceCard({
  title,
  value,
  href,
  delay,
}: {
  title: string;
  value: number;
  href: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="dashboard-card animate-card-in group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className="shrink-0 text-sm text-slate-400 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600">
          →
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
        ₹{value.toFixed(2)}
      </p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/3 rounded-full bg-blue-500 transition-all duration-500 group-hover:w-full" />
      </div>
    </Link>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
  delay,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="dashboard-card animate-card-in group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 transition duration-200 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600">
          {icon}
        </span>

        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function OperationCard({
  title,
  value,
  description,
  href,
  delay,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="dashboard-card animate-card-in group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-sm font-semibold text-slate-400 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600">
          Open →
        </span>
      </div>
    </Link>
  );
}