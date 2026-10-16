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

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export default function SuppliersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingSupplierId, setEditingSupplierId] = useState<
    string | null
  >(null);

  const [statusSupplierId, setStatusSupplierId] = useState<
    string | null
  >(null);

  const [statusAction, setStatusAction] = useState<
    "deactivate" | "reactivate" | null
  >(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [notes, setNotes] = useState("");

  const statusSupplier = suppliers.find(
    (supplier) => supplier.id === statusSupplierId
  );

  const loadSuppliers = useCallback(async () => {
    setError("");

    const { data, error: suppliersError } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (suppliersError) {
      setError(suppliersError.message);
      setSuppliers([]);
    } else {
      setSuppliers(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSuppliers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSuppliers]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingSupplierId(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setGstNumber("");
    setNotes("");
  }

  function startEditing(supplier: Supplier) {
    clearMessages();

    setEditingSupplierId(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone ?? "");
    setEmail(supplier.email ?? "");
    setAddress(supplier.address ?? "");
    setGstNumber(supplier.gst_number ?? "");
    setNotes(supplier.notes ?? "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateForm() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Supplier name is required.");
      return false;
    }

    if (trimmedName.length < 2) {
      setError(
        "Supplier name must contain at least 2 characters."
      );
      return false;
    }

    if (email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        setError("Enter a valid email address.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    const supplierData = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      gst_number:
        gstNumber.trim().toUpperCase() || null,
      notes: notes.trim() || null,
    };

    if (editingSupplierId) {
      const { error: updateError } = await supabase
        .from("suppliers")
        .update(supplierData)
        .eq("id", editingSupplierId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      resetForm();
      await loadSuppliers();

      setSuccess("Supplier updated successfully.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("suppliers")
      .insert({
        ...supplierData,
        is_active: true,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadSuppliers();

    setSuccess("Supplier added successfully.");
    setSaving(false);
  }

  function openStatusDialog(supplier: Supplier) {
    clearMessages();

    setStatusSupplierId(supplier.id);
    setStatusAction(
      supplier.is_active
        ? "deactivate"
        : "reactivate"
    );
  }

  function closeStatusDialog() {
    if (changingStatus) {
      return;
    }

    setStatusSupplierId(null);
    setStatusAction(null);
  }

  async function confirmStatusChange() {
    if (!statusSupplierId || !statusAction) {
      return;
    }

    const supplierId = statusSupplierId;
    const shouldBeActive =
      statusAction === "reactivate";

    setChangingStatus(true);
    clearMessages();

    const { error: updateError } = await supabase
      .from("suppliers")
      .update({
        is_active: shouldBeActive,
      })
      .eq("id", supplierId);

    if (updateError) {
      console.error(
        "Supplier status update error:",
        updateError
      );

      setStatusSupplierId(null);
      setStatusAction(null);
      setChangingStatus(false);

      setError(
        `Unable to ${
          shouldBeActive
            ? "reactivate"
            : "deactivate"
        } this supplier. ${updateError.message}`
      );

      return;
    }

    if (
      editingSupplierId === supplierId &&
      !shouldBeActive
    ) {
      resetForm();
    }

    setStatusSupplierId(null);
    setStatusAction(null);
    setChangingStatus(false);

    await loadSuppliers();

    setSuccess(
      shouldBeActive
        ? "Supplier reactivated successfully."
        : "Supplier deactivated successfully."
    );
  }

  async function handleRefresh() {
    clearMessages();
    await loadSuppliers();
  }

  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.is_active
  ).length;

  const inactiveSuppliers =
    totalSuppliers - activeSuppliers;

  const isReactivate =
    statusAction === "reactivate";

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Suppliers
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage suppliers for components, kits and other purchases.
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

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Suppliers"
            value={totalSuppliers}
            icon="◉"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active Suppliers"
            value={activeSuppliers}
            icon="✓"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            icon="—"
            iconClassName="bg-slate-100 text-slate-600"
          />
        </div>

        {/* Main Layout */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Supplier Form */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingSupplierId
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {editingSupplierId
                    ? "Update the supplier information."
                    : "Add a supplier to your database."}
                </p>
              </div>

              {editingSupplierId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <Field label="Supplier Name">
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="ABC Electronics"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearMessages();
                  }}
                  placeholder="9876543210"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearMessages();
                  }}
                  placeholder="supplier@example.com"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="GST Number">
                <input
                  value={gstNumber}
                  onChange={(e) => {
                    setGstNumber(e.target.value);
                    clearMessages();
                  }}
                  placeholder="GSTIN"
                  disabled={saving}
                  className="input uppercase"
                />
              </Field>

              <Field label="Address">
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Supplier address"
                  disabled={saving}
                  className="input resize-none"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Additional notes"
                  disabled={saving}
                  className="input resize-none"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingSupplierId
                    ? "Updating..."
                    : "Saving..."
                  : editingSupplierId
                    ? "Update Supplier"
                    : "Add Supplier"}
              </button>
            </form>
          </section>

          {/* Supplier List */}
          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Supplier List
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {suppliers.length} supplier
                    {suppliers.length === 1
                      ? ""
                      : "s"} found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleRefresh()
                  }
                  disabled={
                    loading ||
                    saving ||
                    changingStatus
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Loading suppliers...
              </div>
            ) : suppliers.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No suppliers yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first supplier using the form.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[850px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">
                        Supplier
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Contact
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        GST
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Status
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className={`hover:bg-slate-50 ${
                          !supplier.is_active
                            ? "bg-slate-50/70"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p
                            className={`font-semibold ${
                              supplier.is_active
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {supplier.name}
                          </p>

                          {supplier.address && (
                            <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
                              {supplier.address}
                            </p>
                          )}

                          {supplier.notes && (
                            <p className="mt-1 max-w-[280px] truncate text-xs italic text-slate-400">
                              {supplier.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          {supplier.phone && (
                            <p className="text-sm text-slate-700">
                              {supplier.phone}
                            </p>
                          )}

                          {supplier.email && (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                              {supplier.email}
                            </p>
                          )}

                          {!supplier.phone &&
                            !supplier.email && (
                              <span className="text-sm text-slate-400">
                                No contact
                              </span>
                            )}
                        </td>

                        <td className="px-5 py-4 font-mono text-sm text-slate-600 sm:px-6">
                          {supplier.gst_number ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                              supplier.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {supplier.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  supplier
                                )
                              }
                              disabled={
                                saving ||
                                changingStatus
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openStatusDialog(
                                  supplier
                                )
                              }
                              disabled={
                                saving ||
                                changingStatus
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                supplier.is_active
                                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              }`}
                            >
                              {supplier.is_active
                                ? "Deactivate"
                                : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Status Confirmation */}
      <ConfirmDialog
        open={Boolean(
          statusSupplier && statusAction
        )}
        title={
          isReactivate
            ? "Reactivate supplier?"
            : "Deactivate supplier?"
        }
        description={
          statusSupplier
            ? isReactivate
              ? `Are you sure you want to reactivate "${statusSupplier.name}"? It will become available for new purchases again.`
              : `Are you sure you want to deactivate "${statusSupplier.name}"? Existing purchase history will be preserved.`
            : "Are you sure you want to change this supplier's status?"
        }
        confirmText={
          isReactivate
            ? "Reactivate Supplier"
            : "Deactivate Supplier"
        }
        cancelText="Cancel"
        danger={!isReactivate}
        loading={changingStatus}
        onConfirm={() =>
          void confirmStatusChange()
        }
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