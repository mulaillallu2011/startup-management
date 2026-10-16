"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "../ConfirmDialog";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  cost_price: number;
  selling_price: number;
  gst_percent: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
};

const categories = [
  "Robotics Kit",
  "Electronics Kit",
  "Component",
  "Sensor",
  "Motor",
  "Controller",
  "Accessory",
  "Other",
];

export default function ProductsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Electronics Kit");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gstPercent, setGstPercent] = useState("0");
  const [openingStock, setOpeningStock] = useState("0");
  const [minimumStock, setMinimumStock] = useState("0");

  const [statusProductId, setStatusProductId] = useState<string | null>(
    null
  );
  const [statusAction, setStatusAction] = useState<
    "deactivate" | "reactivate" | null
  >(null);

  const statusProduct = products.find(
    (product) => product.id === statusProductId
  );

  const loadProducts = useCallback(async () => {
    setError("");

    const { data, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (productsError) {
      setError(productsError.message);
      setProducts([]);
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  function resetForm() {
    setName("");
    setSku("");
    setCategory("Electronics Kit");
    setDescription("");
    setCostPrice("");
    setSellingPrice("");
    setGstPercent("0");
    setOpeningStock("0");
    setMinimumStock("0");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      setSaving(false);
      return;
    }

    if (!sku.trim()) {
      setError("SKU is required.");
      setSaving(false);
      return;
    }

    const cost = Number(costPrice) || 0;
    const selling = Number(sellingPrice) || 0;
    const gst = Number(gstPercent) || 0;
    const stock = Number(openingStock) || 0;
    const minimum = Number(minimumStock) || 0;

    if (cost < 0 || selling < 0) {
      setError("Prices cannot be negative.");
      setSaving(false);
      return;
    }

    if (gst < 0 || gst > 100) {
      setError("GST must be between 0 and 100.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Opening stock must be a whole number.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(minimum) || minimum < 0) {
      setError("Minimum stock must be a whole number.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("products").insert({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      description: description.trim() || null,
      cost_price: cost,
      selling_price: selling,
      gst_percent: gst,
      stock_quantity: stock,
      minimum_stock: minimum,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadProducts();

    setSaving(false);
  }

  function openDeactivateDialog(id: string) {
    setError("");
    setStatusProductId(id);
    setStatusAction("deactivate");
  }

  function openReactivateDialog(id: string) {
    setError("");
    setStatusProductId(id);
    setStatusAction("reactivate");
  }

  function closeStatusDialog() {
    if (changingStatus) return;

    setStatusProductId(null);
    setStatusAction(null);
  }

  async function confirmStatusChange() {
    if (!statusProductId || !statusAction) {
      return;
    }

    const productId = statusProductId;
    const nextStatus = statusAction === "reactivate";

    setChangingStatus(true);
    setError("");

    const { error: statusError } = await supabase
      .from("products")
      .update({ is_active: nextStatus })
      .eq("id", productId);

    if (statusError) {
      console.error("Product status change error:", statusError);

      setStatusProductId(null);
      setStatusAction(null);
      setChangingStatus(false);

      setError(
        `Unable to ${
          nextStatus ? "reactivate" : "deactivate"
        } this product. ${statusError.message}`
      );

      return;
    }

    setStatusProductId(null);
    setStatusAction(null);
    setChangingStatus(false);

    await loadProducts();
  }

  async function handleRefresh() {
    setError("");
    await loadProducts();
  }

  const isReactivate = statusAction === "reactivate";

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Products
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage your kits, components, sensors and other products.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            <span className="mt-0.5 shrink-0 font-bold">!</span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Action failed</p>

              <p className="mt-1 break-words">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-md px-2 py-1 text-red-600 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Add Product</h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Add a new item to your product database.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4">
              <Field label="Product Name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arduino Starter Kit"
                  className="input"
                />
              </Field>

              <Field label="SKU">
                <input
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="KIT-ARD-001"
                  className="input"
                />
              </Field>

              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description"
                  rows={4}
                  className="input resize-none"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Cost Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="input"
                  />
                </Field>

                <Field label="Selling Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="GST %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Opening Stock">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Minimum Stock">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  className="input"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Product"}
              </button>
            </form>
          </section>

          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Product List
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {products.length} product
                    {products.length === 1 ? "" : "s"} found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No products yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first product using the form.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">Product</th>
                      <th className="px-5 py-4 sm:px-6">SKU</th>
                      <th className="px-5 py-4 sm:px-6">Category</th>
                      <th className="px-5 py-4 sm:px-6">Price</th>
                      <th className="px-5 py-4 sm:px-6">Stock</th>
                      <th className="px-5 py-4 sm:px-6">Status</th>
                      <th className="px-5 py-4 sm:px-6">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => {
                      const lowStock =
                        product.stock_quantity <= product.minimum_stock;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-slate-50 ${
                            !product.is_active ? "bg-slate-50/70" : ""
                          }`}
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p
                              className={`font-semibold ${
                                product.is_active
                                  ? "text-slate-900"
                                  : "text-slate-500"
                              }`}
                            >
                              {product.name}
                            </p>

                            <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                              {product.description || "No description"}
                            </p>
                          </td>

                          <td className="px-5 py-4 font-mono text-sm text-slate-600 sm:px-6">
                            {product.sku}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {product.category}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-semibold text-slate-900">
                              ₹{Number(product.selling_price).toFixed(2)}
                            </p>

                            <p className="text-xs text-slate-500">
                              Cost: ₹
                              {Number(product.cost_price).toFixed(2)}
                            </p>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                                lowStock
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {product.stock_quantity} units
                            </span>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                                product.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            {product.is_active ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openDeactivateDialog(product.id)
                                }
                                disabled={changingStatus}
                                className="whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openReactivateDialog(product.id)
                                }
                                disabled={changingStatus}
                                className="whitespace-nowrap rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(statusProduct && statusAction)}
        title={isReactivate ? "Reactivate product?" : "Deactivate product?"}
        description={
          statusProduct
            ? isReactivate
              ? `Are you sure you want to reactivate "${statusProduct.name}"? It will become an active product again.`
              : `Are you sure you want to deactivate "${statusProduct.name}"? Existing purchase and sales history will be preserved.`
            : "Are you sure you want to change this product's status?"
        }
        confirmText={
          isReactivate ? "Reactivate Product" : "Deactivate Product"
        }
        cancelText="Cancel"
        danger={!isReactivate}
        loading={changingStatus}
        onConfirm={() => void confirmStatusChange()}
        onCancel={closeStatusDialog}
      />

      <style jsx global>{`
        .input {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.75rem 1rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input::placeholder {
          color: rgb(148 163 184);
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
        }

        @media (max-width: 639px) {
          .input {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 w-full">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}