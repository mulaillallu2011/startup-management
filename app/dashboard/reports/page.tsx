"use client";

import { useMemo, useState } from "react";

type ReportType =
  | "sales"
  | "purchases"
  | "payments"
  | "students"
  | "inventory"
  | "finance";

type ReportCard = {
  id: ReportType;
  title: string;
  description: string;
};

const reportCards: ReportCard[] = [
  {
    id: "sales",
    title: "Sales Report",
    description:
      "Review invoices, sales totals, discounts, and revenue.",
  },
  {
    id: "purchases",
    title: "Purchase Report",
    description:
      "Review purchases, supplier spending, and purchase totals.",
  },
  {
    id: "payments",
    title: "Payment Report",
    description:
      "Track student payments, methods, dates, and collection totals.",
  },
  {
    id: "students",
    title: "Student Report",
    description:
      "Review student registrations and student activity.",
  },
  {
    id: "inventory",
    title: "Inventory Report",
    description:
      "Review stock movements and inventory activity.",
  },
  {
    id: "finance",
    title: "Financial Summary",
    description:
      "Combine revenue, purchases, expenses, and financial totals.",
  },
];

export default function ReportsPage() {
  const [reportType, setReportType] =
    useState<ReportType>("sales");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const selectedReport = useMemo(
    () =>
      reportCards.find(
        (report) => report.id === reportType
      ),
    [reportType]
  );

  function clearFilters() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Generate business reports and review your
          financial and operational data.
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Report Center
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a report to continue.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((report) => {
            const selected = report.id === reportType;

            return (
              <button
                key={report.id}
                type="button"
                onClick={() =>
                  setReportType(report.id)
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  selected
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className={`font-bold ${
                        selected
                          ? "text-blue-900"
                          : "text-slate-900"
                      }`}
                    >
                      {report.title}
                    </h3>

                    <p
                      className={`mt-2 text-sm leading-6 ${
                        selected
                          ? "text-blue-800"
                          : "text-slate-500"
                      }`}
                    >
                      {report.description}
                    </p>
                  </div>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Report Filters
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose the date range for the selected report.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="start-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Start Date
            </label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              End Date
            </label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900">
            {selectedReport?.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedReport?.description}
          </p>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
              📊
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Report data is ready to connect
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The report interface is ready. In the next
              step, we will connect{" "}
              <span className="font-semibold text-slate-700">
                {selectedReport?.title}
              </span>{" "}
              to your Supabase data and add totals,
              tables, filters, and export options.
            </p>

            {(startDate || endDate) && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {startDate || "Beginning"} →{" "}
                {endDate || "Today"}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}