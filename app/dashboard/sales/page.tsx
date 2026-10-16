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
  selling_price: number;
  gst_percent: number;
  stock_quantity: number;
  is_active: boolean;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type Sale = {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
};

export default function SalesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [discount, setDiscount] = useState("0");

  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "partial" | "paid" | "cancelled"
  >("paid");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "upi" | "card" | "bank_transfer" | "other"
  >("upi");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmInvoiceOpen, setConfirmInvoiceOpen] = useState(false);

  const loadData = useCallback(async () => {
    setError("");

    const [productsResult, salesResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, selling_price, gst_percent, stock_quantity, is_active"
        )
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("sales")
        .select(
          "id, invoice_number, customer_name, customer_phone, total_amount, payment_status, payment_method, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (productsResult.error) {
      setError(productsResult.error.message);
    } else {
      setProducts(productsResult.data ?? []);
    }

    if (salesResult.error) {
      setError(salesResult.error.message);
    } else {
      setSales(salesResult.data ?? []);
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

  function addToCart() {
    clearMessages();

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a valid whole number quantity.");
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
      setError("This product is currently inactive.");
      return;
    }

    const existing = cart.find(
      (item) => item.productId === selectedProduct
    );

    const currentQuantity = existing?.quantity ?? 0;
    const newQuantity = currentQuantity + amount;

    if (newQuantity > product.stock_quantity) {
      setError(
        `Only ${product.stock_quantity} units are available for ${product.name}.`
      );
      return;
    }

    if (existing) {
      setCart((items) =>
        items.map((item) =>
          item.productId === selectedProduct
            ? {
                ...item,
                quantity: newQuantity,
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
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity("1");
  }

  function removeFromCart(productId: string) {
    setCart((items) =>
      items.filter((item) => item.productId !== productId)
    );

    clearMessages();
  }

  function updateCartQuantity(
    productId: string,
    newQuantity: number
  ) {
    clearMessages();

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    if (!Number.isInteger(newQuantity)) {
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock_quantity) {
      setError(
        `Only ${product.stock_quantity} units are available for ${product.name}.`
      );
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

  function getCartProduct(productId: string) {
    return products.find(
      (product) => product.id === productId
    );
  }

  const cartDetails = cart
    .map((item) => {
      const product = getCartProduct(item.productId);

      if (!product) {
        return null;
      }

      const lineSubtotal =
        Number(product.selling_price) * item.quantity;

      const lineGst =
        lineSubtotal *
        (Number(product.gst_percent) / 100);

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
    Number.isFinite(parsedDiscount) && parsedDiscount > 0
      ? parsedDiscount
      : 0;

  const totalBeforeDiscount = subtotal + gstAmount;

  const totalAmount = Math.max(
    0,
    totalBeforeDiscount - discountAmount
  );

  function validateInvoice() {
    clearMessages();

    if (cart.length === 0) {
      setError("Add at least one product to the invoice.");
      return false;
    }

    const discountValue = Number(discount);

    if (!Number.isFinite(discountValue) || discountValue < 0) {
      setError("Enter a valid discount.");
      return false;
    }

    if (discountValue > totalBeforeDiscount) {
      setError(
        "Discount cannot be greater than the invoice amount."
      );
      return false;
    }

    for (const item of cart) {
      const product = products.find(
        (productItem) => productItem.id === item.productId
      );

      if (!product) {
        setError(
          "One of the products in the cart is no longer available."
        );
        return false;
      }

      if (!product.is_active) {
        setError(
          `${product.name} is no longer active. Remove it from the cart.`
        );
        return false;
      }

      if (item.quantity > product.stock_quantity) {
        setError(
          `Stock changed for ${product.name}. Only ${product.stock_quantity} units are now available.`
        );
        return false;
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        setError(
          `Invalid quantity for ${product.name}.`
        );
        return false;
      }
    }

    return true;
  }

  function openInvoiceConfirmation() {
    if (!validateInvoice()) {
      return;
    }

    setConfirmInvoiceOpen(true);
  }

  function closeInvoiceConfirmation() {
    if (saving) {
      return;
    }

    setConfirmInvoiceOpen(false);
  }

  async function confirmCreateInvoice() {
    if (!validateInvoice()) {
      setConfirmInvoiceOpen(false);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const invoiceNumber = `INV-${Date.now()}`;

    const rpcItems = cart.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const discountValue = Number(discount) || 0;

    const { error: saleError } = await supabase.rpc(
      "create_sale",
      {
        p_invoice_number: invoiceNumber,
        p_customer_name:
          customerName.trim() || null,
        p_customer_phone:
          customerPhone.trim() || null,
        p_customer_email:
          customerEmail.trim() || null,
        p_discount_amount: discountValue,
        p_payment_status: paymentStatus,
        p_payment_method: paymentMethod,
        p_notes: notes.trim() || null,
        p_items: rpcItems,
      }
    );

    if (saleError) {
      console.error("Create sale error:", saleError);

      setConfirmInvoiceOpen(false);
      setSaving(false);

      setError(
        `Unable to create invoice. ${saleError.message}`
      );

      return;
    }

    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDiscount("0");
    setPaymentStatus("paid");
    setPaymentMethod("upi");
    setNotes("");
    setCart([]);
    setConfirmInvoiceOpen(false);

    setSuccess(
      `Invoice ${invoiceNumber} created successfully.`
    );

    await loadData();

    setSaving(false);
  }

  const paymentStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "partial":
        return "bg-amber-100 text-amber-700";

      case "pending":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

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
            Sales & Billing
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Create invoices, record payments and automatically update stock.
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

        <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT */}
          <div className="min-w-0 space-y-6">
            {/* Customer */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Customer Details
              </h2>

              <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-3">
                <Input
                  label="Customer Name"
                  value={customerName}
                  onChange={(value) => {
                    setCustomerName(value);
                    clearMessages();
                  }}
                  placeholder="Customer name"
                  disabled={saving}
                />

                <Input
                  label="Phone"
                  value={customerPhone}
                  onChange={(value) => {
                    setCustomerPhone(value);
                    clearMessages();
                  }}
                  placeholder="Phone number"
                  disabled={saving}
                />

                <Input
                  label="Email"
                  value={customerEmail}
                  onChange={(value) => {
                    setCustomerEmail(value);
                    clearMessages();
                  }}
                  placeholder="customer@email.com"
                  type="email"
                  disabled={saving}
                />
              </div>
            </section>

            {/* Add Product */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Add Products
              </h2>

              <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_140px_140px]">
                <div className="min-w-0">
                  <label
                    htmlFor="sales-product"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Product
                  </label>

                  <select
                    id="sales-product"
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving || loading}
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
                        {product.name} —{" "}
                        {product.stock_quantity} in stock
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="sales-quantity"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Quantity
                  </label>

                  <input
                    id="sales-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={saving}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            {/* Cart */}
            <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Invoice Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {cartDetails.length} item
                  {cartDetails.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              {cartDetails.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No products added
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add products above to build the invoice.
                  </p>
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
                          Qty
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Price
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
                              max={
                                item.product
                                  .stock_quantity
                              }
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartQuantity(
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

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700 sm:px-6">
                            ₹
                            {Number(
                              item.product
                                .selling_price
                            ).toFixed(2)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {item.product.gst_percent}%
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                            ₹{item.lineTotal.toFixed(2)}
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

            {/* Recent Sales */}
            <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Recent Sales
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Latest invoices
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadData()}
                    disabled={loading || saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading sales...
                </div>
              ) : sales.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No sales recorded yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Completed invoices will appear here.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[780px] w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4 sm:px-6">
                          Invoice
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Customer
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
                      {sales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-900 sm:px-6">
                            {sale.invoice_number}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-medium text-slate-900">
                              {sale.customer_name ||
                                "Walk-in Customer"}
                            </p>

                            {sale.customer_phone && (
                              <p className="mt-1 text-xs text-slate-500">
                                {sale.customer_phone}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                            ₹
                            {Number(
                              sale.total_amount
                            ).toFixed(2)}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <div className="space-y-1">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStatusClass(
                                  sale.payment_status
                                )}`}
                              >
                                {sale.payment_status}
                              </span>

                              {sale.payment_method && (
                                <p className="text-xs capitalize text-slate-500">
                                  {sale.payment_method.replace(
                                    "_",
                                    " "
                                  )}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 sm:px-6">
                            {new Date(
                              sale.created_at
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

          {/* RIGHT - BILL SUMMARY */}
          <aside className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <h2 className="text-xl font-bold text-slate-900">
              Bill Summary
            </h2>

            <div className="mt-6 space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                value={`₹${subtotal.toFixed(2)}`}
              />

              <SummaryRow
                label="GST"
                value={`₹${gstAmount.toFixed(2)}`}
              />

              <div className="border-t border-slate-200 pt-4">
                <label
                  htmlFor="discount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Discount
                </label>

                <input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(e.target.value);
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                />
              </div>

              <SummaryRow
                label="Total"
                value={`₹${totalAmount.toFixed(2)}`}
                bold
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <div>
                <label
                  htmlFor="payment-status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment Status
                </label>

                <select
                  id="payment-status"
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
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-method"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment Method
                </label>

                <select
                  id="payment-method"
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
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">
                    Bank Transfer
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sales-notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="sales-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Invoice notes"
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
                onClick={openInvoiceConfirmation}
                className="w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating Invoice..."
                  : "Create Invoice"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Invoice Confirmation */}
      <ConfirmDialog
        open={confirmInvoiceOpen}
        title="Create invoice?"
        description={
          `Create this invoice for ${cartDetails.length} item${
            cartDetails.length === 1 ? "" : "s"
          } with a total of ₹${totalAmount.toFixed(
            2
          )}? This will record the sale and update product stock.`
        }
        confirmText="Create Invoice"
        cancelText="Review Bill"
        danger={false}
        loading={saving}
        onConfirm={() => void confirmCreateInvoice()}
        onCancel={closeInvoiceConfirmation}
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

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input"
      />
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
          : "text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}