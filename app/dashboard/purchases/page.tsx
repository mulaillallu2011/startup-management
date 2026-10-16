"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "../ConfirmDialog";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  gst_percent: number;
  stock_quantity: number;
  is_active: boolean;
};

type Purchase = {
  id: string;
  purchase_number: string;
  supplier_id: string | null;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
};

type PurchaseItem = {
  productId: string;
  quantity: number;
  unitCost: number;
  gstPercent: number;
};

export default function PurchasesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cart, setCart] = useState<PurchaseItem[]>([]);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [gstPercent, setGstPercent] = useState("0");

  const [discount, setDiscount] = useState("0");

  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "partial" | "paid"
  >("paid");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "upi" | "card" | "bank_transfer" | "other"
  >("upi");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmPurchaseOpen, setConfirmPurchaseOpen] =
    useState(false);

  const loadData = useCallback(async () => {
    setError("");

    const [
      suppliersResult,
      productsResult,
      purchasesResult,
    ] = await Promise.all([
      supabase
        .from("suppliers")
        .select("id, name, phone, is_active")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("products")
        .select(
          "id, name, sku, cost_price, gst_percent, stock_quantity, is_active"
        )
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("purchases")
        .select(
          "id, purchase_number, supplier_id, total_amount, payment_status, payment_method, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (suppliersResult.error) {
      setError(suppliersResult.error.message);
    } else {
      setSuppliers(suppliersResult.data ?? []);
    }

    if (productsResult.error) {
      setError(productsResult.error.message);
    } else {
      setProducts(productsResult.data ?? []);
    }

    if (purchasesResult.error) {
      setError(purchasesResult.error.message);
    } else {
      setPurchases(purchasesResult.data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function handleProductChange(productId: string) {
    clearMessages();
    setSelectedProduct(productId);

    const product = products.find(
      (item) => item.id === productId
    );

    if (product) {
      setUnitCost(String(Number(product.cost_price)));
      setGstPercent(String(Number(product.gst_percent)));
    } else {
      setUnitCost("");
      setGstPercent("0");
    }
  }

  function addToCart() {
    clearMessages();

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const amount = Number(quantity);
    const cost = Number(unitCost);
    const gst = Number(gstPercent);

    if (!Number.isInteger(amount) || amount <= 0) {
      setError(
        "Enter a valid whole number for quantity."
      );
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      setError("Enter a valid unit cost.");
      return;
    }

    if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
      setError("GST must be between 0 and 100.");
      return;
    }

    const product = products.find(
      (item) => item.id === selectedProduct
    );

    if (!product) {
      setError("Product not found.");
      return;
    }

    if (!product.is_active) {
      setError("This product is inactive.");
      return;
    }

    const existing = cart.find(
      (item) => item.productId === selectedProduct
    );

    if (existing) {
      setCart((items) =>
        items.map((item) =>
          item.productId === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + amount,
                unitCost: cost,
                gstPercent: gst,
              }
            : item
        )
      );
    } else {
      setCart((items) => [
        ...items,
        {
          productId: selectedProduct,
          quantity: amount,
          unitCost: cost,
          gstPercent: gst,
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity("1");
    setUnitCost("");
    setGstPercent("0");
  }

  function removeFromCart(productId: string) {
    setCart((items) =>
      items.filter((item) => item.productId !== productId)
    );

    clearMessages();
  }

  function updateQuantity(
    productId: string,
    newQuantity: number
  ) {
    clearMessages();

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity <= 0
    ) {
      removeFromCart(productId);
      return;
    }

    setCart((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  }

  function updateUnitCost(
    productId: string,
    newCost: number
  ) {
    if (!Number.isFinite(newCost) || newCost < 0) {
      return;
    }

    setCart((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              unitCost: newCost,
            }
          : item
      )
    );

    clearMessages();
  }

  function updateGst(
    productId: string,
    newGst: number
  ) {
    if (
      !Number.isFinite(newGst) ||
      newGst < 0 ||
      newGst > 100
    ) {
      return;
    }

    setCart((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              gstPercent: newGst,
            }
          : item
      )
    );

    clearMessages();
  }

  const cartDetails = cart
    .map((item) => {
      const product = products.find(
        (productItem) =>
          productItem.id === item.productId
      );

      if (!product) {
        return null;
      }

      const lineSubtotal =
        item.quantity * item.unitCost;

      const lineGst =
        lineSubtotal * (item.gstPercent / 100);

      return {
        ...item,
        product,
        lineSubtotal,
        lineGst,
        lineTotal: lineSubtotal + lineGst,
      };
    })
    .filter(
      (
        item
      ): item is {
        productId: string;
        quantity: number;
        unitCost: number;
        gstPercent: number;
        product: Product;
        lineSubtotal: number;
        lineGst: number;
        lineTotal: number;
      } => item !== null
    );

  const subtotal = cartDetails.reduce(
    (sum, item) => sum + item.lineSubtotal,
    0
  );

  const gstAmount = cartDetails.reduce(
    (sum, item) => sum + item.lineGst,
    0
  );

  const parsedDiscount = Number(discount);

  const discountAmount =
    Number.isFinite(parsedDiscount) &&
    parsedDiscount > 0
      ? parsedDiscount
      : 0;

  const totalBeforeDiscount =
    subtotal + gstAmount;

  const totalAmount = Math.max(
    0,
    totalBeforeDiscount - discountAmount
  );

  function getSupplierName(
    supplierId: string | null
  ) {
    if (!supplierId) {
      return "No supplier";
    }

    return (
      suppliers.find(
        (supplier) =>
          supplier.id === supplierId
      )?.name ?? "Unknown Supplier"
    );
  }

  function validatePurchase() {
    clearMessages();

    if (cart.length === 0) {
      setError(
        "Add at least one product to the purchase."
      );
      return false;
    }

    const discountValue = Number(discount);

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      setError("Enter a valid discount.");
      return false;
    }

    if (discountValue > totalBeforeDiscount) {
      setError(
        "Discount cannot be greater than the purchase amount."
      );
      return false;
    }

    for (const item of cart) {
      const product = products.find(
        (productItem) =>
          productItem.id === item.productId
      );

      if (!product) {
        setError(
          "One of the products in the purchase is no longer available."
        );
        return false;
      }

      if (!product.is_active) {
        setError(
          `${product.name} is inactive. Remove it from the purchase.`
        );
        return false;
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        setError(
          `Invalid quantity for ${product.name}.`
        );
        return false;
      }

      if (
        !Number.isFinite(item.unitCost) ||
        item.unitCost < 0
      ) {
        setError(
          `Invalid unit cost for ${product.name}.`
        );
        return false;
      }

      if (
        !Number.isFinite(item.gstPercent) ||
        item.gstPercent < 0 ||
        item.gstPercent > 100
      ) {
        setError(
          `Invalid GST value for ${product.name}.`
        );
        return false;
      }
    }

    return true;
  }

  function openPurchaseConfirmation() {
    if (!validatePurchase()) {
      return;
    }

    setConfirmPurchaseOpen(true);
  }

  function closePurchaseConfirmation() {
    if (saving) {
      return;
    }

    setConfirmPurchaseOpen(false);
  }

  async function confirmCreatePurchase() {
    if (!validatePurchase()) {
      setConfirmPurchaseOpen(false);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const purchaseNumber = `PUR-${Date.now()}`;

    const rpcItems = cart.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      gst_percent: item.gstPercent,
    }));

    const discountValue = Number(discount) || 0;

    const { error: purchaseError } =
      await supabase.rpc(
        "create_purchase",
        {
          p_purchase_number: purchaseNumber,
          p_supplier_id:
            selectedSupplier || null,
          p_discount_amount: discountValue,
          p_payment_status:
            paymentStatus,
          p_payment_method:
            paymentMethod,
          p_notes:
            notes.trim() || null,
          p_items: rpcItems,
        }
      );

    if (purchaseError) {
      console.error(
        "Create purchase error:",
        purchaseError
      );

      setConfirmPurchaseOpen(false);
      setSaving(false);

      setError(
        `Unable to create purchase. ${purchaseError.message}`
      );

      return;
    }

    setSelectedSupplier("");
    setSelectedProduct("");
    setCart([]);
    setDiscount("0");
    setPaymentStatus("paid");
    setPaymentMethod("upi");
    setNotes("");
    setQuantity("1");
    setUnitCost("");
    setGstPercent("0");
    setConfirmPurchaseOpen(false);

    setSuccess(
      `Purchase ${purchaseNumber} created successfully. Inventory has been updated.`
    );

    await loadData();

    setSaving(false);
  }

  const paymentStatusClass = (
    status: string
  ) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "partial":
        return "bg-amber-100 text-amber-700";

      case "pending":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Purchases
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Record supplier purchases and automatically increase inventory.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            <span className="mt-0.5 shrink-0 font-bold">
              !
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Action failed
              </p>

              <p className="mt-1 break-words">
                {error}
              </p>
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
            <span className="mt-0.5 shrink-0 font-bold">
              ✓
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1 break-words">
                {success}
              </p>
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

        {/* Main Layout */}
        <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Left */}
          <div className="min-w-0 w-full space-y-6">
            {/* Purchase Details */}
            <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Purchase Details
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Select the supplier for this purchase.
              </p>

              <div className="mt-5 min-w-0">
                <label
                  htmlFor="supplier"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Supplier
                </label>

                <select
                  id="supplier"
                  value={selectedSupplier}
                  onChange={(e) => {
                    setSelectedSupplier(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                >
                  <option value="">
                    No supplier
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                      {supplier.phone
                        ? ` — ${supplier.phone}`
                        : ""}
                    </option>
                  ))}
                </select>

                {suppliers.length === 0 &&
                  !loading && (
                    <p className="mt-2 text-sm leading-5 text-amber-600">
                      No active suppliers found. You can still record a purchase without selecting a supplier.
                    </p>
                  )}
              </div>
            </section>

            {/* Add Products */}
            <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Add Products
              </h2>

              <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0 sm:col-span-2">
                  <label
                    htmlFor="purchase-product"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Product
                  </label>

                  <select
                    id="purchase-product"
                    value={selectedProduct}
                    onChange={(e) =>
                      handleProductChange(
                        e.target.value
                      )
                    }
                    disabled={
                      saving || loading
                    }
                    className="input"
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="purchase-quantity"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Quantity
                  </label>

                  <input
                    id="purchase-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </div>

                <div className="flex min-w-0 items-end">
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={saving}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Product
                  </button>
                </div>
              </div>

              <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="purchase-unit-cost"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Unit Cost
                  </label>

                  <input
                    id="purchase-unit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => {
                      setUnitCost(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    placeholder="0.00"
                    disabled={saving}
                    className="input"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="purchase-gst"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    GST %
                  </label>

                  <input
                    id="purchase-gst"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={gstPercent}
                    onChange={(e) => {
                      setGstPercent(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </div>
              </div>
            </section>

            {/* Purchase Items */}
            <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Purchase Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {cartDetails.length} item
                  {cartDetails.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              {cartDetails.length === 0 ? (
                <div className="p-8 text-center sm:p-10">
                  <p className="font-semibold text-slate-700">
                    No products added
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add products above to build the purchase.
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto">
                  <table className="min-w-[850px] w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4 sm:px-6">
                          Product
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Quantity
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Unit Cost
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          GST
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Total
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {cartDetails.map((item) => (
                        <tr
                          key={item.productId}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-semibold text-slate-900">
                              {item.product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.product.sku}
                            </p>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateQuantity(
                                  item.productId,
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              disabled={saving}
                              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-center outline-none focus:border-blue-500 disabled:bg-slate-50"
                            />
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) =>
                                  updateUnitCost(
                                    item.productId,
                                    Number(
                                      e.target
                                        .value
                                    )
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
                              />
                            </div>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                item.gstPercent
                              }
                              onChange={(e) =>
                                updateGst(
                                  item.productId,
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              disabled={saving}
                              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-center outline-none focus:border-blue-500 disabled:bg-slate-50"
                            />
                            <span className="ml-1 text-sm text-slate-500">
                              %
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                            ₹
                            {item.lineTotal.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.productId
                                )
                              }
                              disabled={saving}
                              className="whitespace-nowrap text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent Purchases */}
            <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Recent Purchases
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Latest supplier purchases
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void loadData()
                    }
                    disabled={
                      loading || saving
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading purchases...
                </div>
              ) : purchases.length === 0 ? (
                <div className="p-8 text-center sm:p-10">
                  <p className="font-semibold text-slate-700">
                    No purchases recorded yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Completed purchases will appear here.
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto">
                  <table className="min-w-[740px] w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4 sm:px-6">
                          Purchase
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Supplier
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Total
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Payment
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {purchases.map(
                        (purchase) => (
                          <tr
                            key={purchase.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-900 sm:px-6">
                              {
                                purchase.purchase_number
                              }
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                              {getSupplierName(
                                purchase.supplier_id
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                              ₹
                              {Number(
                                purchase.total_amount
                              ).toFixed(2)}
                            </td>

                            <td className="px-5 py-4 sm:px-6">
                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStatusClass(
                                  purchase.payment_status
                                )}`}
                              >
                                {
                                  purchase.payment_status
                                }
                              </span>

                              {purchase.payment_method && (
                                <p className="mt-1 text-xs capitalize text-slate-500">
                                  {purchase.payment_method.replace(
                                    "_",
                                    " "
                                  )}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 sm:px-6">
                              {new Date(
                                purchase.created_at
                              ).toLocaleString()}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <h2 className="text-xl font-bold text-slate-900">
              Purchase Summary
            </h2>

            <div className="mt-6 space-y-3">
              <SummaryRow
                label="Subtotal"
                value={`₹${subtotal.toFixed(
                  2
                )}`}
              />

              <SummaryRow
                label="GST"
                value={`₹${gstAmount.toFixed(
                  2
                )}`}
              />

              <div className="border-t border-slate-200 pt-4">
                <label
                  htmlFor="purchase-discount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Discount
                </label>

                <input
                  id="purchase-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                />
              </div>

              <SummaryRow
                label="Total"
                value={`₹${totalAmount.toFixed(
                  2
                )}`}
                bold
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <div>
                <label
                  htmlFor="purchase-payment-status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment Status
                </label>

                <select
                  id="purchase-payment-status"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(
                      e.target.value as typeof paymentStatus
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                >
                  <option value="paid">
                    Paid
                  </option>

                  <option value="partial">
                    Partial
                  </option>

                  <option value="pending">
                    Pending
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="purchase-payment-method"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment Method
                </label>

                <select
                  id="purchase-payment-method"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(
                      e.target.value as typeof paymentMethod
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                >
                  <option value="upi">
                    UPI
                  </option>

                  <option value="cash">
                    Cash
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="purchase-notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="purchase-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="Purchase notes"
                  disabled={saving}
                  className="input resize-none"
                />
              </div>

              <button
                type="button"
                disabled={
                  saving ||
                  loading ||
                  cart.length === 0
                }
                onClick={
                  openPurchaseConfirmation
                }
                className="w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating Purchase..."
                  : "Create Purchase"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Purchase Confirmation */}
      <ConfirmDialog
        open={confirmPurchaseOpen}
        title="Create purchase?"
        description={`Create this purchase with ${cartDetails.length} item${
          cartDetails.length === 1
            ? ""
            : "s"
        } for a total of ₹${totalAmount.toFixed(
          2
        )}? This will record the purchase and increase inventory.`}
        confirmText="Create Purchase"
        cancelText="Review Purchase"
        danger={false}
        loading={saving}
        onConfirm={() =>
          void confirmCreatePurchase()
        }
        onCancel={
          closePurchaseConfirmation
        }
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
          box-shadow:
            0 0 0 3px rgb(59 130 246 / 0.1);
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

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        bold
          ? "pt-2 text-lg font-bold text-slate-900"
          : "text-sm text-slate-600"
      }`}
    >
      <span className="min-w-0">
        {label}
      </span>

      <span className="shrink-0 whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}