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

type Student = {
  id: string;
  admission_number: string;
  full_name: string;
  class_level: string | null;
  school_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export default function StudentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingStudentId, setEditingStudentId] = useState<
    string | null
  >(null);

  const [statusStudentId, setStatusStudentId] = useState<
    string | null
  >(null);

  const [statusAction, setStatusAction] = useState<
    "deactivate" | "reactivate" | null
  >(null);

  const [admissionNumber, setAdmissionNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const statusStudent = students.find(
    (student) => student.id === statusStudentId
  );

  const loadStudents = useCallback(async () => {
    setError("");

    const { data, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (studentsError) {
      setError(studentsError.message);
      setStudents([]);
    } else {
      setStudents(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStudents]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingStudentId(null);
    setAdmissionNumber("");
    setFullName("");
    setClassLevel("");
    setSchoolName("");
    setParentName("");
    setParentPhone("");
    setParentEmail("");
    setAddress("");
    setNotes("");
  }

  function startEditing(student: Student) {
    clearMessages();

    setEditingStudentId(student.id);
    setAdmissionNumber(student.admission_number);
    setFullName(student.full_name);
    setClassLevel(student.class_level ?? "");
    setSchoolName(student.school_name ?? "");
    setParentName(student.parent_name ?? "");
    setParentPhone(student.parent_phone ?? "");
    setParentEmail(student.parent_email ?? "");
    setAddress(student.address ?? "");
    setNotes(student.notes ?? "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateForm() {
    const trimmedAdmission = admissionNumber.trim();
    const trimmedName = fullName.trim();

    if (!trimmedAdmission) {
      setError("Admission number is required.");
      return false;
    }

    if (trimmedAdmission.length < 2) {
      setError(
        "Admission number must contain at least 2 characters."
      );
      return false;
    }

    if (!trimmedName) {
      setError("Student name is required.");
      return false;
    }

    if (trimmedName.length < 2) {
      setError(
        "Student name must contain at least 2 characters."
      );
      return false;
    }

    if (parentEmail.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(parentEmail.trim())) {
        setError("Enter a valid parent email address.");
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

    const commonData = {
      admission_number:
        admissionNumber.trim().toUpperCase(),
      full_name: fullName.trim(),
      class_level: classLevel.trim() || null,
      school_name: schoolName.trim() || null,
      parent_name: parentName.trim() || null,
      parent_phone: parentPhone.trim() || null,
      parent_email: parentEmail.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    if (editingStudentId) {
      const { error: updateError } = await supabase
        .from("students")
        .update({
          ...commonData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingStudentId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      resetForm();
      await loadStudents();

      setSuccess("Student updated successfully.");
      setSaving(false);
      return;
    }

    const { data: userResult } =
      await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("students")
      .insert({
        ...commonData,
        is_active: true,
        created_by: userResult.user?.id ?? null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadStudents();

    setSuccess("Student added successfully.");
    setSaving(false);
  }

  function openStatusDialog(student: Student) {
    clearMessages();

    setStatusStudentId(student.id);
    setStatusAction(
      student.is_active
        ? "deactivate"
        : "reactivate"
    );
  }

  function closeStatusDialog() {
    if (changingStatus) {
      return;
    }

    setStatusStudentId(null);
    setStatusAction(null);
  }

  async function confirmStatusChange() {
    if (!statusStudentId || !statusAction) {
      return;
    }

    const studentId = statusStudentId;
    const shouldBeActive =
      statusAction === "reactivate";

    setChangingStatus(true);
    clearMessages();

    const { error: updateError } = await supabase
      .from("students")
      .update({
        is_active: shouldBeActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (updateError) {
      console.error(
        "Student status update error:",
        updateError
      );

      setStatusStudentId(null);
      setStatusAction(null);
      setChangingStatus(false);

      setError(
        `Unable to ${
          shouldBeActive
            ? "reactivate"
            : "deactivate"
        } this student. ${updateError.message}`
      );

      return;
    }

    if (
      editingStudentId === studentId &&
      !shouldBeActive
    ) {
      resetForm();
    }

    setStatusStudentId(null);
    setStatusAction(null);
    setChangingStatus(false);

    await loadStudents();

    setSuccess(
      shouldBeActive
        ? "Student reactivated successfully."
        : "Student deactivated successfully."
    );
  }

  async function handleRefresh() {
    clearMessages();
    await loadStudents();
  }

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) => student.is_active
  ).length;

  const inactiveStudents =
    totalStudents - activeStudents;

  const isReactivate =
    statusAction === "reactivate";

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Students
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage student records and parent contact details.
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
            title="Total Students"
            value={totalStudents}
            icon="♙"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active Students"
            value={activeStudents}
            icon="✓"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Inactive Students"
            value={inactiveStudents}
            icon="—"
            iconClassName="bg-slate-100 text-slate-600"
          />
        </div>

        {/* Main Layout */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Student Form */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingStudentId
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {editingStudentId
                    ? "Update the student information."
                    : "Create a new student record."}
                </p>
              </div>

              {editingStudentId && (
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
              <Field label="Admission Number">
                <input
                  required
                  value={admissionNumber}
                  onChange={(e) => {
                    setAdmissionNumber(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="STU-001"
                  disabled={saving}
                  className="input uppercase"
                />
              </Field>

              <Field label="Student Name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Student full name"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Class">
                <input
                  value={classLevel}
                  onChange={(e) => {
                    setClassLevel(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Class 8"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="School">
                <input
                  value={schoolName}
                  onChange={(e) => {
                    setSchoolName(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="School name"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Parent / Guardian Name">
                <input
                  value={parentName}
                  onChange={(e) => {
                    setParentName(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="Parent name"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Parent Phone">
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => {
                    setParentPhone(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="9876543210"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Parent Email">
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => {
                    setParentEmail(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="parent@example.com"
                  disabled={saving}
                  className="input"
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
                  placeholder="Student address"
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
                  ? editingStudentId
                    ? "Updating..."
                    : "Saving..."
                  : editingStudentId
                    ? "Update Student"
                    : "Add Student"}
              </button>
            </form>
          </section>

          {/* Student List */}
          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Student List
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {students.length} student
                    {students.length === 1
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
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No students yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first student using the form.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[980px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">
                        Student
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Admission
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Class / School
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Parent
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
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50 ${
                          !student.is_active
                            ? "bg-slate-50/70"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p
                            className={`font-semibold ${
                              student.is_active
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {student.full_name}
                          </p>

                          {student.parent_email && (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                              {student.parent_email}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 font-mono text-sm text-slate-600 sm:px-6">
                          {student.admission_number}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <p className="text-sm font-medium text-slate-700">
                            {student.class_level ||
                              "—"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {student.school_name ||
                              "No school"}
                          </p>
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <p className="text-sm text-slate-700">
                            {student.parent_name ||
                              "—"}
                          </p>

                          {student.parent_phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                student.parent_phone
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                              student.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {student.is_active
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
                                  student
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
                                  student
                                )
                              }
                              disabled={
                                saving ||
                                changingStatus
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                student.is_active
                                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              }`}
                            >
                              {student.is_active
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
          statusStudent && statusAction
        )}
        title={
          isReactivate
            ? "Reactivate student?"
            : "Deactivate student?"
        }
        description={
          statusStudent
            ? isReactivate
              ? `Are you sure you want to reactivate "${statusStudent.full_name}"? This student will become active again.`
              : `Are you sure you want to deactivate "${statusStudent.full_name}"? The student record and history will be preserved.`
            : "Are you sure you want to change this student's status?"
        }
        confirmText={
          isReactivate
            ? "Reactivate Student"
            : "Deactivate Student"
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