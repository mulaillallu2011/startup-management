"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type CompanySettings = {
  id: string;
  company_name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  invoice_prefix: string;
  currency: string;
  logo_url: string | null;
};

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [settingsId, setSettingsId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [currency, setCurrency] = useState("INR");
  const [logoUrl, setLogoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setError("");

    const { data, error: settingsError } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      setError(settingsError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("Company settings record was not found.");
      setLoading(false);
      return;
    }

    const settings = data as CompanySettings;

    setSettingsId(settings.id);
    setCompanyName(settings.company_name ?? "");
    setTagline(settings.tagline ?? "");
    setPhone(settings.phone ?? "");
    setEmail(settings.email ?? "");
    setWebsite(settings.website ?? "");
    setAddress(settings.address ?? "");
    setGstNumber(settings.gst_number ?? "");
    setPanNumber(settings.pan_number ?? "");
    setInvoicePrefix(settings.invoice_prefix ?? "INV-");
    setCurrency(settings.currency ?? "INR");
    setLogoUrl(settings.logo_url ?? "");

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSettings]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    if (!settingsId) {
      setError("Settings record is not available.");
      setSaving(false);
      return;
    }

    const { data: userResult } =
      await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("company_settings")
      .update({
        company_name: companyName.trim(),
        tagline: tagline.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        gst_number:
          gstNumber.trim().toUpperCase() || null,
        pan_number:
          panNumber.trim().toUpperCase() || null,
        invoice_prefix:
          invoicePrefix.trim() || "INV-",
        currency:
          currency.trim().toUpperCase() || "INR",
        logo_url: logoUrl.trim() || null,
        updated_at: new Date().toISOString(),
        updated_by: userResult.user?.id ?? null,
      })
      .eq("id", settingsId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Company settings saved successfully.");
    await loadSettings();

    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>

        <p className="mt-2 text-slate-600">
          Manage company information and invoice preferences.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Company Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic details shown throughout the management system.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Company Name">
                <input
                  required
                  value={companyName}
                  onChange={(e) =>
                    setCompanyName(e.target.value)
                  }
                  placeholder="Your company name"
                  className="input"
                />
              </Field>

              <Field label="Tagline">
                <input
                  value={tagline}
                  onChange={(e) =>
                    setTagline(e.target.value)
                  }
                  placeholder="Your company tagline"
                  className="input"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="9876543210"
                  className="input"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="company@example.com"
                  className="input"
                />
              </Field>

              <Field label="Website">
                <input
                  type="url"
                  value={website}
                  onChange={(e) =>
                    setWebsite(e.target.value)
                  }
                  placeholder="https://example.com"
                  className="input"
                />
              </Field>

              <Field label="Logo URL">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) =>
                    setLogoUrl(e.target.value)
                  }
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address">
                  <textarea
                    rows={4}
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Company address"
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Tax & invoice */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Tax & Invoice Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Information used for billing and invoices.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="GST Number">
                <input
                  value={gstNumber}
                  onChange={(e) =>
                    setGstNumber(e.target.value)
                  }
                  placeholder="GSTIN"
                  className="input"
                />
              </Field>

              <Field label="PAN Number">
                <input
                  value={panNumber}
                  onChange={(e) =>
                    setPanNumber(e.target.value)
                  }
                  placeholder="PAN"
                  className="input"
                />
              </Field>

              <Field label="Invoice Prefix">
                <input
                  required
                  value={invoicePrefix}
                  onChange={(e) =>
                    setInvoicePrefix(e.target.value)
                  }
                  placeholder="INV-"
                  className="input"
                />
              </Field>

              <Field label="Currency">
                <select
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value)
                  }
                  className="input"
                >
                  <option value="INR">
                    INR — Indian Rupee
                  </option>

                  <option value="USD">
                    USD — US Dollar
                  </option>

                  <option value="EUR">
                    EUR — Euro
                  </option>

                  <option value="GBP">
                    GBP — British Pound
                  </option>
                </select>
              </Field>
            </div>
          </section>

          {/* Preview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Company Preview
            </h2>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {companyName || "Company Name"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {tagline || "Company tagline"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-mono text-sm font-semibold text-slate-700">
                    {invoicePrefix || "INV-"}000001
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Currency: {currency || "INR"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-3">
                <InfoItem
                  label="Phone"
                  value={phone || "Not set"}
                />

                <InfoItem
                  label="Email"
                  value={email || "Not set"}
                />

                <InfoItem
                  label="GST"
                  value={gstNumber || "Not set"}
                />
              </div>

              {address && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                  </p>

                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {address}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.75rem 1rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
        }

        .input:disabled {
          cursor: not-allowed;
          background: rgb(241 245 249);
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
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
}