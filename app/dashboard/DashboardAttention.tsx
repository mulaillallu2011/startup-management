import Link from "next/link";

type AttentionProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number;
};

export default function DashboardAttention({
  products,
}: {
  products: AttentionProduct[];
}) {
  return (
    <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Attention
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Needs Attention
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Inventory items that need action.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            products.length > 0
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {products.length > 0
            ? `${products.length} item${products.length === 1 ? "" : "s"}`
            : "All clear"}
        </span>
      </div>

      <div className="mt-6">
        {products.length > 0 ? (
          <div className="space-y-3">
            {products.slice(0, 5).map((product) => {
              const stock = Number(product.stock_quantity ?? 0);
              const minimum = Number(product.minimum_stock ?? 0);
              const outOfStock = stock <= 0;

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    outOfStock
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      outOfStock
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {outOfStock ? "!" : "⚠"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {product.name}
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
                        : `${stock} units remaining · Minimum ${minimum}`}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/inventory"
                    className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                  >
                    View →
                  </Link>
                </div>
              );
            })}

            {products.length > 5 && (
              <p className="pt-1 text-center text-xs text-slate-400">
                +{products.length - 5} more items need attention
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-600">
              ✓
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Everything looks good
            </p>

            <p className="mt-1 text-xs text-slate-400">
              No products are currently below their minimum stock level.
            </p>
          </div>
        )}
      </div>

      <Link
        href="/dashboard/inventory"
        className="mt-5 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      >
        Open Inventory
      </Link>
    </div>
  );
}