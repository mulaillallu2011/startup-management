"use client";

import {
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
  stock_quantity: number;
  minimum_stock: number;
  selling_price: number;
  is_active: boolean;
};

type Movement = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity_change: number;
  notes: string | null;
  created_at: string;
};

export default function InventoryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const selectedProductData = products.find(
    (product) => product.id === selectedProduct
  );

  const loadInventory = useCallback(async () => {
    setError("");

    const [productsResult, movementsResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, category, stock_quantity, minimum_stock, selling_price, is_active"
        )
        .order("name"),

      supabase
        .from("inventory_movements")
        .select(
          "id, product_id, movement_type, quantity_change, notes, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
    } else {
      setProducts(productsResult.data ?? []);
    }

    if (movementsResult.error) {
      setError(movementsResult.error.message);
    } else {
      setMovements(movementsResult.data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInventory();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadInventory]);

  function validateAdjustment() {
    if (!selectedProduct) {
      setError("Please select a product.");
      setSuccess("");
      return null;
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a valid whole number greater than zero.");
      setSuccess("");
      return null;
    }

    if (!selectedProductData) {
      setError("The selected product could not be found.");
      setSuccess("");
      return null;
    }

    return {
      amount,
      product: selectedProductData,
    };
  }

  async function handleAdjustment(change: 1 | -1) {
    const validation = validateAdjustment();

    if (!validation) {
      return;
    }

    const { amount, product } = validation;

    if (change === -1 && amount > product.stock_quantity) {
      setError(
        `Cannot remove ${amount} units. ${product.name} currently has only ${product.stock_quantity} units in stock.`
      );
      setSuccess("");
      return;
    }

    if (change === -1) {
      setRemoveDialogOpen(true);
      return;
    }

    await performAdjustment(1, amount);
  }

  async function performAdjustment(
    change: 1 | -1,
    amount: number
  ) {
    if (!selectedProduct) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const quantityChange = change === 1 ? amount : -amount;

    const { error: adjustmentError } = await supabase.rpc(
      "adjust_inventory",
      {
        p_product_id: selectedProduct,
        p_quantity_change: quantityChange,
        p_notes: notes.trim() || null,
      }
    );

    if (adjustmentError) {
      console.error("Inventory adjustment error:", adjustmentError);

      setRemoveDialogOpen(false);
      setSaving(false);

      setError(
        `Unable to ${
          change === 1 ? "add" : "remove"
        } stock. ${adjustmentError.message}`
      );

      return;
    }

    setQuantity("");
    setNotes("");
    setSelectedProduct("");
    setRemoveDialogOpen(false);

    setSuccess(
      change === 1
        ? `${amount} units added to ${selectedProductData?.name ?? "product"} successfully.`
        : `${amount} units removed from ${selectedProductData?.name ?? "product"} successfully.`
    );

    await loadInventory();

    setSaving(false);
  }

  async function confirmRemoveStock() {
    const validation = validateAdjustment();

    if (!validation) {
      setRemoveDialogOpen(false);
      return;
    }

    const { amount, product } = validation;

    if (amount > product.stock_quantity) {
      setRemoveDialogOpen(false);
      setError(
        `Cannot remove ${amount} units. ${product.name} currently has only ${product.stock_quantity} units in stock.`
      );
      return;
    }

    await performAdjustment(-1, amount);
  }

  function closeRemoveDialog() {
    if (saving) {
      return;
    }

    setRemoveDialogOpen(false);
  }

  async function handleRefresh() {
    setError("");
    setSuccess("");
    await loadInventory();
  }

  function getProductName(productId: string) {
    return (
      products.find((product) => product.id === productId)?.name ??
      "Unknown Product"
    );
  }

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stock_quantity ?? 0),
    0
  );

  const lowStockCount = products.filter(
    (product) =>
      product.is_active &&
      Number(product.stock_quantity ?? 0) <=
        Number(product.minimum_stock ?? 0)
  ).length;

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Inventory
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Monitor stock levels and record inventory adjustments.
          </p>
        </div>

        {/* Error */}
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

        {/* Success */}
        {success && (
          <div className="mb-6 flex w-full items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
            <span className="mt-0.5 shrink-0 font-bold">✓</span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Success</p>
              <p className="mt-1 break-words">{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="shrink-0 rounded-md px-2 py-1 text-green-600 transition hover:bg-green-100"
              aria-label="Dismiss success message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Products"
            value={activeProducts}
            icon="▣"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total Units"
            value={totalUnits}
            icon="▤"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Low Stock"
            value={lowStockCount}
            icon="!"
            iconClassName="bg-red-50 text-red-600"
          />

          <StatCard
            title="Recent Movements"
            value={movements.length}
            icon="↕"
            iconClassName="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Adjustment + Current Stock */}
        <div className="mb-8 grid w-full min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Adjustment */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Adjust Stock
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Increase or decrease the current stock.
            </p>

            <div className="mt-6 space-y-4">
              {/* Product */}
              <div>
                <label
                  htmlFor="product"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Product
                </label>

                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={saving}
                  className="input"
                >
                  <option value="">Select product</option>

                  {products
                    .filter((product) => product.is_active)
                    .map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} ({product.stock_quantity} in stock)
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected Product Info */}
              {selectedProductData && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Selected Product
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-blue-900">
                        {selectedProductData.name}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        SKU: {selectedProductData.sku}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-blue-500">
                        Current Stock
                      </p>

                      <p className="text-lg font-bold text-blue-900">
                        {selectedProductData.stock_quantity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="10"
                  disabled={saving}
                  className="input"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for adjustment"
                  disabled={saving}
                  className="input resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAdjustment(1)}
                  className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "+ Add Stock"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAdjustment(-1)}
                  className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "− Remove Stock"}
                </button>
              </div>
            </div>
          </section>

          {/* Current Stock */}
          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Current Stock
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current stock levels for all products
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={loading || saving}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Loading inventory...
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add products first from the Products section.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[780px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">
                        Product
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        SKU
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Category
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Stock
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Status
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Product Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => {
                      const stock = Number(product.stock_quantity ?? 0);
                      const minimum = Number(product.minimum_stock ?? 0);
                      const lowStock =
                        product.is_active && stock <= minimum;

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
                          </td>

                          <td className="px-5 py-4 font-mono text-sm text-slate-600 sm:px-6">
                            {product.sku}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {product.category}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-semibold text-slate-900">
                              {stock} units
                            </p>

                            <p className="text-xs text-slate-500">
                              Minimum: {minimum}
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
                              {!product.is_active
                                ? "Inactive"
                                : lowStock
                                  ? "Low Stock"
                                  : "Stock OK"}
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
                              {product.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
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

        {/* Movement History */}
        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Inventory Movements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest stock adjustments
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading movements...
            </div>
          ) : movements.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No inventory movements yet.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[820px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4 sm:px-6">
                      Product
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Type
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Change
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Notes
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900 sm:px-6">
                        {getProductName(movement.product_id)}
                      </td>

                      <td className="px-5 py-4 text-sm capitalize text-slate-600 sm:px-6">
                        {movement.movement_type}
                      </td>

                      <td
                        className={`px-5 py-4 font-bold sm:px-6 ${
                          movement.quantity_change > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.quantity_change > 0 ? "+" : ""}
                        {movement.quantity_change}
                      </td>

                      <td className="max-w-[280px] px-5 py-4 text-sm text-slate-500 sm:px-6">
                        <span className="block truncate">
                          {movement.notes || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 sm:px-6">
                        {new Date(
                          movement.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Remove Stock Confirmation */}
      <ConfirmDialog
        open={removeDialogOpen}
        title="Remove stock?"
        description={
          selectedProductData
            ? `Are you sure you want to remove ${Number(quantity) || 0} units from "${selectedProductData.name}"? The current stock is ${selectedProductData.stock_quantity} units.`
            : "Are you sure you want to remove this stock?"
        }
        confirmText="Remove Stock"
        cancelText="Keep Stock"
        danger
        loading={saving}
        onConfirm={() => void confirmRemoveStock()}
        onCancel={closeRemoveDialog}
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

        .input:disabled {
          cursor: not-allowed;
          background: rgb(248 250 252);
          opacity: 0.7;
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

function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: string;
  iconClassName: string;
}) {
  return (
    <div className="dashboard-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm transition duration-200 group-hover:scale-110 ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}