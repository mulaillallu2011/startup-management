"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "../ConfirmDialog";

type Student = {
  id: string;
  admission_number: string;
  full_name: string;
};

type Batch = {
  id: string;
  batch_code: string;
  name: string;
  course_id: string;
};

type Course = {
  id: string;
  course_code: string;
  name: string;
  fee: number;
};

type Enrollment = {
  id: string;
  batch_id: string;
  student_id: string;
  status: string;
};

type Payment = {
  id: string;
  receipt_number: string;
  student_id: string;
  batch_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_reference: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

export default function PaymentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [amount, setAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "upi" | "card" | "bank_transfer" | "other"
  >("upi");

  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "pending" | "failed" | "refunded"
  >("paid");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmPaymentOpen, setConfirmPaymentOpen] =
    useState(false);

  const loadData = useCallback(async () => {
    setError("");

    const [
      studentsResult,
      batchesResult,
      coursesResult,
      enrollmentsResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("id, admission_number, full_name")
        .eq("is_active", true)
        .order("full_name"),

      supabase
        .from("batches")
        .select("id, batch_code, name, course_id")
        .in("status", ["upcoming", "active"])
        .order("name"),

      supabase
        .from("courses")
        .select("id, course_code, name, fee")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("batch_students")
        .select("id, batch_id, student_id, status")
        .eq("status", "active"),

      supabase
        .from("payments")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(30),
    ]);

    if (studentsResult.error) {
      setError(studentsResult.error.message);
    } else {
      setStudents(studentsResult.data ?? []);
    }

    if (batchesResult.error) {
      setError(batchesResult.error.message);
    } else {
      setBatches(batchesResult.data ?? []);
    }

    if (coursesResult.error) {
      setError(coursesResult.error.message);
    } else {
      setCourses(coursesResult.data ?? []);
    }

    if (enrollmentsResult.error) {
      setError(enrollmentsResult.error.message);
    } else {
      setEnrollments(enrollmentsResult.data ?? []);
    }

    if (paymentsResult.error) {
      setError(paymentsResult.error.message);
    } else {
      setPayments(paymentsResult.data ?? []);
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

  const enrolledStudents = selectedBatch
    ? enrollments
        .filter(
          (enrollment) =>
            enrollment.batch_id === selectedBatch &&
            enrollment.status === "active"
        )
        .map((enrollment) =>
          students.find(
            (student) =>
              student.id === enrollment.student_id
          )
        )
        .filter(
          (student): student is Student =>
            student !== undefined
        )
        .sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        )
    : [];

  function handleBatchChange(batchId: string) {
    clearMessages();
    setSelectedBatch(batchId);
    setSelectedStudent("");
  }

  function validatePayment() {
    clearMessages();

    if (!selectedBatch) {
      setError("Please select a batch.");
      return false;
    }

    if (!selectedStudent) {
      setError("Please select a student.");
      return false;
    }

    const isEnrolled = enrollments.some(
      (enrollment) =>
        enrollment.batch_id === selectedBatch &&
        enrollment.student_id === selectedStudent &&
        enrollment.status === "active"
    );

    if (!isEnrolled) {
      setError(
        "The selected student is not actively enrolled in this batch."
      );
      return false;
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      setError("Enter a valid payment amount greater than zero.");
      return false;
    }

    if (!paymentDate) {
      setError("Please select a payment date.");
      return false;
    }

    if (
      !["cash", "upi", "card", "bank_transfer", "other"].includes(
        paymentMethod
      )
    ) {
      setError("Select a valid payment method.");
      return false;
    }

    if (
      !["paid", "pending", "failed", "refunded"].includes(
        paymentStatus
      )
    ) {
      setError("Select a valid payment status.");
      return false;
    }

    return true;
  }

  function openPaymentConfirmation() {
    if (!validatePayment()) {
      return;
    }

    setConfirmPaymentOpen(true);
  }

  function closePaymentConfirmation() {
    if (saving) {
      return;
    }

    setConfirmPaymentOpen(false);
  }

  async function confirmRecordPayment() {
    if (!validatePayment()) {
      setConfirmPaymentOpen(false);
      return;
    }

    const paymentAmount = Number(amount);

    setSaving(true);
    setError("");
    setSuccess("");

    const receiptNumber = `REC-${Date.now()}`;

    const { error: paymentError } = await supabase.rpc(
      "record_student_payment",
      {
        p_receipt_number: receiptNumber,
        p_student_id: selectedStudent,
        p_batch_id: selectedBatch,
        p_amount: paymentAmount,
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_transaction_reference:
          transactionReference.trim() || null,
        p_payment_date: paymentDate,
        p_notes: notes.trim() || null,
      }
    );

    if (paymentError) {
      console.error(
        "Record student payment error:",
        paymentError
      );

      setConfirmPaymentOpen(false);
      setSaving(false);

      setError(
        `Unable to record payment. ${paymentError.message}`
      );

      return;
    }

    setAmount("");
    setTransactionReference("");
    setNotes("");
    setPaymentStatus("paid");
    setPaymentMethod("upi");
    setPaymentDate(
      new Date().toISOString().slice(0, 10)
    );
    setSelectedStudent("");
    setConfirmPaymentOpen(false);

    setSuccess(
      `Payment recorded successfully. Receipt: ${receiptNumber}`
    );

    await loadData();

    setSaving(false);
  }

  function getStudentName(studentId: string) {
    const student = students.find(
      (item) => item.id === studentId
    );

    return student
      ? `${student.full_name} (${student.admission_number})`
      : "Unknown Student";
  }

  function getBatchName(batchId: string) {
    const batch = batches.find(
      (item) => item.id === batchId
    );

    return batch
      ? `${batch.name} (${batch.batch_code})`
      : "Unknown Batch";
  }

  function getCourseName(courseId: string) {
    const course = courses.find(
      (item) => item.id === courseId
    );

    return course
      ? course.name
      : "Unknown Course";
  }

  function getBatchCourse(batchId: string) {
    const batch = batches.find(
      (item) => item.id === batchId
    );

    return batch
      ? getCourseName(batch.course_id)
      : "Unknown Course";
  }

  function getPaymentStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-amber-100 text-amber-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  const totalPaid = payments
    .filter(
      (payment) =>
        payment.payment_status === "paid"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  const pendingAmount = payments
    .filter(
      (payment) =>
        payment.payment_status === "pending"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  const paidCount = payments.filter(
    (payment) =>
      payment.payment_status === "paid"
  ).length;

  const failedCount = payments.filter(
    (payment) =>
      payment.payment_status === "failed"
  ).length;

  const selectedBatchData = batches.find(
    (batch) => batch.id === selectedBatch
  );

  const selectedCourse = selectedBatchData
    ? courses.find(
        (course) =>
          course.id === selectedBatchData.course_id
      )
    : null;

  const selectedStudentData = students.find(
    (student) => student.id === selectedStudent
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Payments
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Record student fees and track payment history.
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

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Payment Records"
            value={payments.length}
            currency={false}
            icon="₹"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Paid Total"
            value={totalPaid}
            currency
            icon="✓"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Pending Total"
            value={pendingAmount}
            currency
            icon="◷"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Paid Payments"
            value={paidCount}
            currency={false}
            icon="✓"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Failed Payments"
            value={failedCount}
            currency={false}
            icon="!"
            iconClassName="bg-red-50 text-red-600"
          />
        </div>

        {/* Main */}
        <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Payment Form */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Record Payment
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Record a fee payment for an enrolled student.
            </p>

            <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
              {/* Batch */}
              <div className="min-w-0">
                <label
                  htmlFor="batch"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Batch
                </label>

                <select
                  id="batch"
                  value={selectedBatch}
                  onChange={(e) =>
                    handleBatchChange(
                      e.target.value
                    )
                  }
                  disabled={saving || loading}
                  className="input"
                >
                  <option value="">
                    Select batch
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch.id}
                      value={batch.id}
                    >
                      {batch.name} (
                      {batch.batch_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student */}
              <div className="min-w-0">
                <label
                  htmlFor="student"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Student
                </label>

                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  disabled={
                    !selectedBatch ||
                    saving ||
                    loading
                  }
                  className="input"
                >
                  <option value="">
                    {selectedBatch
                      ? enrolledStudents.length > 0
                        ? "Select student"
                        : "No enrolled students"
                      : "Select batch first"}
                  </option>

                  {enrolledStudents.map(
                    (student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.full_name} (
                        {
                          student.admission_number
                        })
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Course Information */}
              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Course
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedCourse
                      ? selectedCourse.name
                      : "Select a batch"}
                  </p>

                  {selectedCourse && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedCourse.course_code
                      }{" "}
                      · Course fee: ₹
                      {Number(
                        selectedCourse.fee
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="min-w-0">
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Amount
                </label>

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="5000"
                  disabled={saving}
                  className="input"
                />
              </div>

              {/* Date */}
              <div className="min-w-0">
                <label
                  htmlFor="payment-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment Date
                </label>

                <input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => {
                    setPaymentDate(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                />
              </div>

              {/* Method */}
              <div className="min-w-0">
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

              {/* Status */}
              <div className="min-w-0">
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
                  <option value="paid">
                    Paid
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="failed">
                    Failed
                  </option>

                  <option value="refunded">
                    Refunded
                  </option>
                </select>
              </div>

              {/* Transaction Reference */}
              <div className="min-w-0 md:col-span-2">
                <label
                  htmlFor="transaction-reference"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Transaction Reference
                </label>

                <input
                  id="transaction-reference"
                  value={transactionReference}
                  onChange={(e) => {
                    setTransactionReference(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="UPI transaction ID / bank reference"
                  disabled={saving}
                  className="input"
                />
              </div>

              {/* Notes */}
              <div className="min-w-0 md:col-span-2">
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
                  onChange={(e) => {
                    setNotes(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Payment notes"
                  disabled={saving}
                  className="input resize-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={
                saving ||
                loading ||
                !selectedBatch ||
                !selectedStudent
              }
              onClick={openPaymentConfirmation}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Recording Payment..."
                : "Record Payment"}
            </button>
          </section>

          {/* Summary */}
          <aside className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <h2 className="text-xl font-bold text-slate-900">
              Payment Summary
            </h2>

            <div className="mt-6 space-y-4">
              <InfoRow
                label="Batch"
                value={
                  selectedBatch
                    ? getBatchName(
                        selectedBatch
                      )
                    : "Not selected"
                }
              />

              <InfoRow
                label="Student"
                value={
                  selectedStudentData
                    ? `${selectedStudentData.full_name} (${selectedStudentData.admission_number})`
                    : "Not selected"
                }
              />

              <InfoRow
                label="Course"
                value={
                  selectedBatch
                    ? getBatchCourse(
                        selectedBatch
                      )
                    : "Not selected"
                }
              />

              <InfoRow
                label="Course Fee"
                value={
                  selectedCourse
                    ? `₹${Number(
                        selectedCourse.fee
                      ).toFixed(2)}`
                    : "—"
                }
              />

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Payment Amount
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  ₹
                  {Number(
                    amount || 0
                  ).toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">
                  Receipt number
                </p>

                <p className="mt-1 font-mono text-sm text-blue-900">
                  Generated automatically
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                      paymentStatus
                    )}`}
                  >
                    {paymentStatus}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Method
                  </span>

                  <span className="text-sm font-semibold capitalize text-slate-700">
                    {paymentMethod.replace(
                      "_",
                      " "
                    )}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Recent Payments */}
        <section className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-8">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Payments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest student fee payments
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadData()}
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
            <div className="p-10 text-center text-slate-500">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No payments recorded yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Recorded student payments will appear here.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1050px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4 sm:px-6">
                      Receipt
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Student
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Batch
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Amount
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Method
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Status
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Reference
                    </th>

                    <th className="px-5 py-4 sm:px-6">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-900 sm:px-6">
                          {
                            payment.receipt_number
                          }
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700 sm:px-6">
                          {getStudentName(
                            payment.student_id
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                          {getBatchName(
                            payment.batch_id
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                          ₹
                          {Number(
                            payment.amount
                          ).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-sm capitalize text-slate-600 sm:px-6">
                          {payment.payment_method.replace(
                            "_",
                            " "
                          )}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                              payment.payment_status
                            )}`}
                          >
                            {
                              payment.payment_status
                            }
                          </span>
                        </td>

                        <td className="max-w-[220px] px-5 py-4 sm:px-6">
                          <p className="truncate text-sm text-slate-500">
                            {payment.transaction_reference ||
                              "—"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 sm:px-6">
                          {new Date(
                            payment.payment_date
                          ).toLocaleDateString()}
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

      {/* Confirmation */}
      <ConfirmDialog
        open={confirmPaymentOpen}
        title="Record payment?"
        description={
          `Record a ${paymentStatus} payment of ₹${Number(
            amount || 0
          ).toFixed(2)} for ${
            selectedStudentData?.full_name ??
            "the selected student"
          }? This will create a permanent payment record and receipt.`
        }
        confirmText="Record Payment"
        cancelText="Review Payment"
        danger={false}
        loading={saving}
        onConfirm={() =>
          void confirmRecordPayment()
        }
        onCancel={
          closePaymentConfirmation
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  currency,
  icon,
  iconClassName,
}: {
  title: string;
  value: number;
  currency: boolean;
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
            {currency
              ? `₹${value.toFixed(2)}`
              : value}
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