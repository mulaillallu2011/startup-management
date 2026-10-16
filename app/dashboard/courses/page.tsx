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

type Course = {
  id: string;
  course_code: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  fee: number;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
};

export default function CoursesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingCourseId, setEditingCourseId] = useState<
    string | null
  >(null);

  const [statusCourseId, setStatusCourseId] = useState<
    string | null
  >(null);

  const [statusAction, setStatusAction] = useState<
    "deactivate" | "reactivate" | null
  >(null);

  const [courseCode, setCourseCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [fee, setFee] = useState("");
  const [maxStudents, setMaxStudents] = useState("");

  const statusCourse = courses.find(
    (course) => course.id === statusCourseId
  );

  const loadCourses = useCallback(async () => {
    setError("");

    const { data, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (coursesError) {
      setError(coursesError.message);
      setCourses([]);
    } else {
      setCourses(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCourses();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCourses]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingCourseId(null);
    setCourseCode("");
    setName("");
    setDescription("");
    setDurationWeeks("4");
    setFee("");
    setMaxStudents("");
  }

  function startEditing(course: Course) {
    clearMessages();

    setEditingCourseId(course.id);
    setCourseCode(course.course_code);
    setName(course.name);
    setDescription(course.description ?? "");
    setDurationWeeks(String(course.duration_weeks));
    setFee(String(Number(course.fee)));
    setMaxStudents(
      course.max_students === null
        ? ""
        : String(course.max_students)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateForm() {
    const trimmedCode = courseCode.trim();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Course code is required.");
      return false;
    }

    if (trimmedCode.length < 2) {
      setError(
        "Course code must contain at least 2 characters."
      );
      return false;
    }

    if (!trimmedName) {
      setError("Course name is required.");
      return false;
    }

    if (trimmedName.length < 2) {
      setError(
        "Course name must contain at least 2 characters."
      );
      return false;
    }

    const duration = Number(durationWeeks);

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      setError(
        "Duration must be a positive whole number."
      );
      return false;
    }

    const courseFee = Number(fee);

    if (
      !Number.isFinite(courseFee) ||
      courseFee < 0
    ) {
      setError("Enter a valid course fee.");
      return false;
    }

    if (maxStudents.trim() !== "") {
      const parsedMaxStudents = Number(maxStudents);

      if (
        !Number.isInteger(parsedMaxStudents) ||
        parsedMaxStudents <= 0
      ) {
        setError(
          "Maximum students must be a positive whole number."
        );
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

    const duration = Number(durationWeeks);
    const courseFee = Number(fee);

    let maximumStudents: number | null = null;

    if (maxStudents.trim() !== "") {
      maximumStudents = Number(maxStudents);
    }

    const courseData = {
      course_code: courseCode
        .trim()
        .toUpperCase(),
      name: name.trim(),
      description:
        description.trim() || null,
      duration_weeks: duration,
      fee: courseFee,
      max_students: maximumStudents,
    };

    if (editingCourseId) {
      const { error: updateError } =
        await supabase
          .from("courses")
          .update({
            ...courseData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCourseId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      resetForm();
      await loadCourses();

      setSuccess("Course updated successfully.");
      setSaving(false);
      return;
    }

    const { data: userResult } =
      await supabase.auth.getUser();

    const { error: insertError } =
      await supabase.from("courses").insert({
        ...courseData,
        is_active: true,
        created_by: userResult.user?.id ?? null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadCourses();

    setSuccess("Course added successfully.");
    setSaving(false);
  }

  function openStatusDialog(course: Course) {
    clearMessages();

    setStatusCourseId(course.id);
    setStatusAction(
      course.is_active
        ? "deactivate"
        : "reactivate"
    );
  }

  function closeStatusDialog() {
    if (changingStatus) {
      return;
    }

    setStatusCourseId(null);
    setStatusAction(null);
  }

  async function confirmStatusChange() {
    if (!statusCourseId || !statusAction) {
      return;
    }

    const courseId = statusCourseId;
    const shouldBeActive =
      statusAction === "reactivate";

    setChangingStatus(true);
    clearMessages();

    const { error: updateError } =
      await supabase
        .from("courses")
        .update({
          is_active: shouldBeActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

    if (updateError) {
      console.error(
        "Course status update error:",
        updateError
      );

      setStatusCourseId(null);
      setStatusAction(null);
      setChangingStatus(false);

      setError(
        `Unable to ${
          shouldBeActive
            ? "reactivate"
            : "deactivate"
        } this course. ${updateError.message}`
      );

      return;
    }

    if (
      editingCourseId === courseId &&
      !shouldBeActive
    ) {
      resetForm();
    }

    setStatusCourseId(null);
    setStatusAction(null);
    setChangingStatus(false);

    await loadCourses();

    setSuccess(
      shouldBeActive
        ? "Course reactivated successfully."
        : "Course deactivated successfully."
    );
  }

  async function handleRefresh() {
    clearMessages();
    await loadCourses();
  }

  const totalCourses = courses.length;

  const activeCourses = courses.filter(
    (course) => course.is_active
  ).length;

  const inactiveCourses =
    totalCourses - activeCourses;

  const isReactivate =
    statusAction === "reactivate";

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Courses
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage courses, duration, fees and student capacity.
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
            title="Total Courses"
            value={totalCourses}
            icon="▦"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active Courses"
            value={activeCourses}
            icon="✓"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Inactive Courses"
            value={inactiveCourses}
            icon="—"
            iconClassName="bg-slate-100 text-slate-600"
          />
        </div>

        {/* Main Layout */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Course Form */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCourseId
                    ? "Edit Course"
                    : "Add Course"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {editingCourseId
                    ? "Update the course information."
                    : "Create a course for your training programs."}
                </p>
              </div>

              {editingCourseId && (
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
              <Field label="Course Code">
                <input
                  required
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="ROB-101"
                  disabled={saving}
                  className="input uppercase"
                />
              </Field>

              <Field label="Course Name">
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Robotics Fundamentals"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="Course description"
                  disabled={saving}
                  className="input resize-none"
                />
              </Field>

              <Field label="Duration (weeks)">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={durationWeeks}
                  onChange={(e) => {
                    setDurationWeeks(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Course Fee">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={fee}
                  onChange={(e) => {
                    setFee(e.target.value);
                    clearMessages();
                  }}
                  placeholder="5000"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Maximum Students (optional)">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxStudents}
                  onChange={(e) => {
                    setMaxStudents(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="20"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingCourseId
                    ? "Updating..."
                    : "Saving..."
                  : editingCourseId
                    ? "Update Course"
                    : "Add Course"}
              </button>
            </form>
          </section>

          {/* Course List */}
          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Course List
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {courses.length} course
                    {courses.length === 1
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
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No courses yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first course using the form.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">
                        Course
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Duration
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Fee
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Capacity
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
                    {courses.map((course) => (
                      <tr
                        key={course.id}
                        className={`hover:bg-slate-50 ${
                          !course.is_active
                            ? "bg-slate-50/70"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p
                            className={`font-semibold ${
                              course.is_active
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {course.name}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {course.course_code}
                          </p>

                          {course.description && (
                            <p className="mt-1 max-w-[300px] truncate text-xs text-slate-500">
                              {course.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                          {course.duration_weeks} week
                          {course.duration_weeks === 1
                            ? ""
                            : "s"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-6">
                          ₹
                          {Number(
                            course.fee
                          ).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                          {course.max_students ??
                            "Unlimited"}
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                              course.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {course.is_active
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
                                  course
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
                                  course
                                )
                              }
                              disabled={
                                saving ||
                                changingStatus
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                course.is_active
                                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              }`}
                            >
                              {course.is_active
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
          statusCourse && statusAction
        )}
        title={
          isReactivate
            ? "Reactivate course?"
            : "Deactivate course?"
        }
        description={
          statusCourse
            ? isReactivate
              ? `Are you sure you want to reactivate "${statusCourse.name}"? It will become available for active training use again.`
              : `Are you sure you want to deactivate "${statusCourse.name}"? Existing course records and history will be preserved.`
            : "Are you sure you want to change this course's status?"
        }
        confirmText={
          isReactivate
            ? "Reactivate Course"
            : "Deactivate Course"
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