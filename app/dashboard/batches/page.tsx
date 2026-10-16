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
  is_active: boolean;
};

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
  start_date: string | null;
  end_date: string | null;
  days_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  max_students: number | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type BatchStudent = {
  id: string;
  batch_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
};

const statuses = [
  "upcoming",
  "active",
  "completed",
  "cancelled",
];

export default function BatchesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollments, setEnrollments] = useState<BatchStudent[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [removingEnrollment, setRemovingEnrollment] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingBatchId, setEditingBatchId] = useState<
    string | null
  >(null);

  const [statusBatchId, setStatusBatchId] = useState<
    string | null
  >(null);

  const [statusChange, setStatusChange] = useState<string | null>(
    null
  );

  const [removeEnrollmentId, setRemoveEnrollmentId] = useState<
    string | null
  >(null);

  const [batchCode, setBatchCode] = useState("");
  const [batchName, setBatchName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [notes, setNotes] = useState("");

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const statusBatch = batches.find(
    (batch) => batch.id === statusBatchId
  );

  const removeEnrollment = enrollments.find(
    (enrollment) => enrollment.id === removeEnrollmentId
  );

  const removeEnrollmentStudent = removeEnrollment
    ? students.find(
        (student) => student.id === removeEnrollment.student_id
      )
    : null;

  const removeEnrollmentBatch = removeEnrollment
    ? batches.find(
        (batch) => batch.id === removeEnrollment.batch_id
      )
    : null;

  const loadData = useCallback(async () => {
    setError("");

    const [
      coursesResult,
      studentsResult,
      batchesResult,
      enrollmentsResult,
    ] = await Promise.all([
      supabase
        .from("courses")
        .select("id, course_code, name, is_active")
        .order("name"),

      supabase
        .from("students")
        .select("id, admission_number, full_name")
        .eq("is_active", true)
        .order("full_name"),

      supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("batch_students")
        .select(
          "id, batch_id, student_id, enrolled_at, status"
        )
        .order("enrolled_at", { ascending: false }),
    ]);

    if (coursesResult.error) {
      setError(coursesResult.error.message);
    } else {
      setCourses(coursesResult.data ?? []);
    }

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

    if (enrollmentsResult.error) {
      setError(enrollmentsResult.error.message);
    } else {
      setEnrollments(enrollmentsResult.data ?? []);
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

  function resetForm() {
    setEditingBatchId(null);
    setBatchCode("");
    setBatchName("");
    setCourseId("");
    setStartDate("");
    setEndDate("");
    setDaysOfWeek("");
    setStartTime("");
    setEndTime("");
    setMaxStudents("");
    setStatus("upcoming");
    setNotes("");
  }

  function startEditing(batch: Batch) {
    clearMessages();

    setEditingBatchId(batch.id);
    setBatchCode(batch.batch_code);
    setBatchName(batch.name);
    setCourseId(batch.course_id);
    setStartDate(batch.start_date ?? "");
    setEndDate(batch.end_date ?? "");
    setDaysOfWeek(batch.days_of_week ?? "");
    setStartTime(batch.start_time ?? "");
    setEndTime(batch.end_time ?? "");
    setMaxStudents(
      batch.max_students === null
        ? ""
        : String(batch.max_students)
    );
    setStatus(batch.status);
    setNotes(batch.notes ?? "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateBatchForm() {
    const trimmedCode = batchCode.trim();
    const trimmedName = batchName.trim();

    if (!trimmedCode) {
      setError("Batch code is required.");
      return false;
    }

    if (trimmedCode.length < 2) {
      setError(
        "Batch code must contain at least 2 characters."
      );
      return false;
    }

    if (!trimmedName) {
      setError("Batch name is required.");
      return false;
    }

    if (trimmedName.length < 2) {
      setError(
        "Batch name must contain at least 2 characters."
      );
      return false;
    }

    if (!courseId) {
      setError("Please select a course.");
      return false;
    }

    if (startDate && endDate && endDate < startDate) {
      setError(
        "End date cannot be earlier than the start date."
      );
      return false;
    }

    if (startTime && endTime && endTime <= startTime) {
      setError(
        "End time must be later than the start time."
      );
      return false;
    }

    if (maxStudents.trim() !== "") {
      const parsed = Number(maxStudents);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        setError(
          "Maximum students must be a positive whole number."
        );
        return false;
      }

      if (editingBatchId) {
        const currentCount =
          getBatchEnrollmentCount(editingBatchId);

        if (parsed < currentCount) {
          setError(
            `Maximum students cannot be lower than the current enrollment of ${currentCount}.`
          );
          return false;
        }
      }
    }

    if (!statuses.includes(status)) {
      setError("Please select a valid batch status.");
      return false;
    }

    return true;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!validateBatchForm()) {
      return;
    }

    setSaving(true);

    let maximumStudents: number | null = null;

    if (maxStudents.trim() !== "") {
      maximumStudents = Number(maxStudents);
    }

    const batchData = {
      batch_code: batchCode.trim().toUpperCase(),
      name: batchName.trim(),
      course_id: courseId,
      start_date: startDate || null,
      end_date: endDate || null,
      days_of_week: daysOfWeek.trim() || null,
      start_time: startTime || null,
      end_time: endTime || null,
      max_students: maximumStudents,
      status,
      notes: notes.trim() || null,
    };

    if (editingBatchId) {
      const { error: updateError } = await supabase
        .from("batches")
        .update({
          ...batchData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBatchId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      resetForm();
      await loadData();

      setSuccess("Batch updated successfully.");
      setSaving(false);
      return;
    }

    const { data: userResult } =
      await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("batches")
      .insert({
        ...batchData,
        created_by: userResult.user?.id ?? null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadData();

    setSuccess("Batch created successfully.");
    setSaving(false);
  }

  function openStatusDialog(
    batch: Batch,
    newStatus: string
  ) {
    clearMessages();

    if (newStatus === batch.status) {
      return;
    }

    setStatusBatchId(batch.id);
    setStatusChange(newStatus);
  }

  function closeStatusDialog() {
    if (changingStatus) {
      return;
    }

    setStatusBatchId(null);
    setStatusChange(null);
  }

  async function confirmStatusChange() {
    if (!statusBatchId || !statusChange) {
      return;
    }

    const batchId = statusBatchId;
    const newStatus = statusChange;

    setChangingStatus(true);
    clearMessages();

    const { error: updateError } = await supabase
      .from("batches")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId);

    if (updateError) {
      console.error(
        "Batch status update error:",
        updateError
      );

      setStatusBatchId(null);
      setStatusChange(null);
      setChangingStatus(false);

      setError(
        `Unable to update the batch status. ${updateError.message}`
      );

      return;
    }

    if (
      editingBatchId === batchId &&
      (newStatus === "completed" ||
        newStatus === "cancelled")
    ) {
      resetForm();
    }

    setStatusBatchId(null);
    setStatusChange(null);
    setChangingStatus(false);

    await loadData();

    setSuccess(
      `Batch status changed to ${newStatus}.`
    );
  }

  function validateEnrollment() {
    clearMessages();

    if (!selectedBatch) {
      setError("Please select a batch.");
      return null;
    }

    if (!selectedStudent) {
      setError("Please select a student.");
      return null;
    }

    const batch = batches.find(
      (item) => item.id === selectedBatch
    );

    if (!batch) {
      setError("Batch not found.");
      return null;
    }

    if (
      batch.status === "completed" ||
      batch.status === "cancelled"
    ) {
      setError(
        "Students cannot be enrolled in a completed or cancelled batch."
      );
      return null;
    }

    const currentCount = enrollments.filter(
      (item) =>
        item.batch_id === selectedBatch &&
        item.status === "active"
    ).length;

    if (
      batch.max_students !== null &&
      currentCount >= batch.max_students
    ) {
      setError(
        "This batch has reached its maximum capacity."
      );
      return null;
    }

    const alreadyEnrolled = enrollments.some(
      (item) =>
        item.batch_id === selectedBatch &&
        item.student_id === selectedStudent &&
        item.status === "active"
    );

    if (alreadyEnrolled) {
      setError(
        "This student is already enrolled in this batch."
      );
      return null;
    }

    return {
      batch,
      currentCount,
    };
  }

  async function enrollStudent() {
    const validation = validateEnrollment();

    if (!validation) {
      return;
    }

    setEnrolling(true);

    const { error: insertError } = await supabase
      .from("batch_students")
      .insert({
        batch_id: selectedBatch,
        student_id: selectedStudent,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
      setEnrolling(false);
      return;
    }

    setSelectedStudent("");

    await loadData();

    setSuccess("Student enrolled successfully.");
    setEnrolling(false);
  }

  function openRemoveEnrollmentDialog(
    enrollment: BatchStudent
  ) {
    clearMessages();
    setRemoveEnrollmentId(enrollment.id);
  }

  function closeRemoveEnrollmentDialog() {
    if (removingEnrollment) {
      return;
    }

    setRemoveEnrollmentId(null);
  }

  async function confirmRemoveEnrollment() {
    if (!removeEnrollmentId) {
      return;
    }

    const enrollmentId = removeEnrollmentId;

    setRemovingEnrollment(true);
    clearMessages();

    const { error: updateError } = await supabase
      .from("batch_students")
      .update({
        status: "dropped",
      })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error(
        "Enrollment removal error:",
        updateError
      );

      setRemoveEnrollmentId(null);
      setRemovingEnrollment(false);

      setError(
        `Unable to remove the student from the batch. ${updateError.message}`
      );

      return;
    }

    setRemoveEnrollmentId(null);
    setRemovingEnrollment(false);

    await loadData();

    setSuccess(
      "Student removed from the active batch."
    );
  }

  function getCourseName(courseIdValue: string) {
    const course = courses.find(
      (item) => item.id === courseIdValue
    );

    return course
      ? `${course.name} (${course.course_code})`
      : "Unknown Course";
  }

  function getStudentName(studentId: string) {
    const student = students.find(
      (item) => item.id === studentId
    );

    return student
      ? `${student.full_name} (${student.admission_number})`
      : "Unknown Student";
  }

  function getBatchEnrollmentCount(batchId: string) {
    return enrollments.filter(
      (item) =>
        item.batch_id === batchId &&
        item.status === "active"
    ).length;
  }

  const totalBatches = batches.length;

  const activeBatches = batches.filter(
    (batch) => batch.status === "active"
  ).length;

  const upcomingBatches = batches.filter(
    (batch) => batch.status === "upcoming"
  ).length;

  const completedBatches = batches.filter(
    (batch) => batch.status === "completed"
  ).length;

  const activeEnrollments = enrollments.filter(
    (item) => item.status === "active"
  ).length;

  const selectedBatchEnrollments = selectedBatch
    ? enrollments.filter(
        (item) =>
          item.batch_id === selectedBatch &&
          item.status === "active"
      )
    : [];

  const selectedBatchData = selectedBatch
    ? batches.find(
        (batch) => batch.id === selectedBatch
      )
    : null;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Batches
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Organize courses into batches and enroll students.
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
            title="Total Batches"
            value={totalBatches}
            icon="◌"
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Active Batches"
            value={activeBatches}
            icon="✓"
            iconClassName="bg-green-50 text-green-600"
          />

          <StatCard
            title="Upcoming"
            value={upcomingBatches}
            icon="◷"
            iconClassName="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Completed"
            value={completedBatches}
            icon="▣"
            iconClassName="bg-purple-50 text-purple-600"
          />

          <StatCard
            title="Active Enrollments"
            value={activeEnrollments}
            icon="♙"
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>

        {/* Main Layout */}
        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Batch Form */}
          <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingBatchId
                    ? "Edit Batch"
                    : "Create Batch"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {editingBatchId
                    ? "Update the batch information."
                    : "Create a new training batch."}
                </p>
              </div>

              {editingBatchId && (
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
              <Field label="Batch Code">
                <input
                  required
                  value={batchCode}
                  onChange={(e) => {
                    setBatchCode(e.target.value);
                    clearMessages();
                  }}
                  placeholder="BAT-001"
                  disabled={saving}
                  className="input uppercase"
                />
              </Field>

              <Field label="Batch Name">
                <input
                  required
                  value={batchName}
                  onChange={(e) => {
                    setBatchName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Saturday Robotics Batch"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <Field label="Course">
                <select
                  required
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                >
                  <option value="">
                    Select course
                  </option>

                  {courses
                    .filter(
                      (course) =>
                        course.is_active ||
                        course.id === courseId
                    )
                    .map((course) => (
                      <option
                        key={course.id}
                        value={course.id}
                      >
                        {course.name} (
                        {course.course_code})
                        {!course.is_active
                          ? " — Inactive"
                          : ""}
                      </option>
                    ))}
                </select>

                {courses.length === 0 &&
                  !loading && (
                    <p className="mt-2 text-sm text-amber-600">
                      No courses found.
                    </p>
                  )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start Date">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </Field>

                <Field label="End Date">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Days of Week">
                <input
                  value={daysOfWeek}
                  onChange={(e) => {
                    setDaysOfWeek(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  placeholder="Saturday, Sunday"
                  disabled={saving}
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Start Time">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </Field>

                <Field label="End Time">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(
                        e.target.value
                      );
                      clearMessages();
                    }}
                    disabled={saving}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Maximum Students">
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

              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    clearMessages();
                  }}
                  disabled={saving}
                  className="input"
                >
                  {statuses.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item.charAt(0).toUpperCase() +
                        item.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notes">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Batch notes"
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
                  ? editingBatchId
                    ? "Updating..."
                    : "Saving..."
                  : editingBatchId
                    ? "Update Batch"
                    : "Create Batch"}
              </button>
            </form>
          </section>

          {/* Batch List */}
          <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    Batch List
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {batches.length} batch
                    {batches.length === 1
                      ? ""
                      : "es"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadData()}
                  disabled={
                    loading ||
                    saving ||
                    changingStatus ||
                    enrolling ||
                    removingEnrollment
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Loading batches...
              </div>
            ) : batches.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No batches created yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first batch using the form.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1050px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">
                        Batch
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Course
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Schedule
                      </th>

                      <th className="px-5 py-4 sm:px-6">
                        Students
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
                    {batches.map((batch) => {
                      const count =
                        getBatchEnrollmentCount(
                          batch.id
                        );

                      return (
                        <tr
                          key={batch.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-semibold text-slate-900">
                              {batch.name}
                            </p>

                            <p className="mt-1 font-mono text-xs text-slate-500">
                              {batch.batch_code}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                            {getCourseName(
                              batch.course_id
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            <p>
                              {batch.start_date ||
                                "No start date"}
                            </p>

                            {batch.end_date && (
                              <p className="mt-1 text-xs">
                                Ends:{" "}
                                {batch.end_date}
                              </p>
                            )}

                            {batch.days_of_week && (
                              <p className="mt-1 text-xs">
                                {
                                  batch.days_of_week
                                }
                              </p>
                            )}

                            {batch.start_time && (
                              <p className="text-xs">
                                {
                                  batch.start_time
                                }
                                {batch.end_time
                                  ? ` - ${batch.end_time}`
                                  : ""}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                            {count}

                            {batch.max_students !==
                            null
                              ? ` / ${batch.max_students}`
                              : ""}
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                batch.status ===
                                "active"
                                  ? "bg-green-100 text-green-700"
                                  : batch.status ===
                                      "upcoming"
                                    ? "bg-blue-100 text-blue-700"
                                    : batch.status ===
                                        "completed"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-red-100 text-red-700"
                              }`}
                            >
                              {batch.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBatch(
                                    batch.id
                                  );
                                  clearMessages();
                                }}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
                              >
                                Manage
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(
                                    batch
                                  )
                                }
                                disabled={
                                  saving ||
                                  changingStatus
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <select
                                value={
                                  batch.status
                                }
                                onChange={(e) =>
                                  openStatusDialog(
                                    batch,
                                    e.target.value
                                  )
                                }
                                disabled={
                                  saving ||
                                  changingStatus
                                }
                                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {statuses.map(
                                  (item) => (
                                    <option
                                      key={item}
                                      value={item}
                                    >
                                      {item}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
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

        {/* Enrollment Manager */}
        <section className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-8">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-xl font-bold text-slate-900">
              Student Enrollment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add students to a selected batch and manage active enrollments.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <label
                htmlFor="selected-batch"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Batch
              </label>

              <select
                id="selected-batch"
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(
                    e.target.value
                  );
                  setSelectedStudent("");
                  clearMessages();
                }}
                disabled={
                  enrolling ||
                  removingEnrollment
                }
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
                    {batch.name} ({batch.batch_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="selected-student"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Student
              </label>

              <select
                id="selected-student"
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(
                    e.target.value
                  );
                  clearMessages();
                }}
                disabled={
                  enrolling ||
                  removingEnrollment ||
                  !selectedBatch
                }
                className="input"
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.full_name} (
                    {student.admission_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  void enrollStudent()
                }
                disabled={
                  enrolling ||
                  removingEnrollment ||
                  !selectedBatch ||
                  !selectedStudent
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {enrolling
                  ? "Enrolling..."
                  : "Enroll Student"}
              </button>
            </div>
          </div>

          {selectedBatch && (
            <div className="border-t border-slate-200">
              {selectedBatchData && (
                <div className="grid gap-3 bg-slate-50 px-5 py-4 sm:grid-cols-3 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Batch
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedBatchData.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 font-semibold capitalize text-slate-900">
                      {
                        selectedBatchData.status
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Capacity
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedBatchEnrollments.length
                      }

                      {selectedBatchData.max_students !==
                      null
                        ? ` / ${selectedBatchData.max_students}`
                        : " / Unlimited"}
                    </p>
                  </div>
                </div>
              )}

              <div className="px-5 py-5 sm:px-6">
                <h3 className="font-bold text-slate-900">
                  Enrolled Students
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    selectedBatchEnrollments.length
                  }{" "}
                  active enrollment
                  {selectedBatchEnrollments.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              {selectedBatchEnrollments.length ===
              0 ? (
                <div className="px-5 pb-8 text-sm text-slate-500 sm:px-6">
                  No students enrolled in this batch yet.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4 sm:px-6">
                          Student
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Enrolled
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Status
                        </th>

                        <th className="px-5 py-4 sm:px-6">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selectedBatchEnrollments.map(
                        (enrollment) => (
                          <tr
                            key={enrollment.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-medium text-slate-900 sm:px-6">
                              {getStudentName(
                                enrollment.student_id
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500 sm:px-6">
                              {new Date(
                                enrollment.enrolled_at
                              ).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-4 sm:px-6">
                              <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Active
                              </span>
                            </td>

                            <td className="px-5 py-4 sm:px-6">
                              <button
                                type="button"
                                onClick={() =>
                                  openRemoveEnrollmentDialog(
                                    enrollment
                                  )
                                }
                                disabled={
                                  removingEnrollment
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Batch Status Confirmation */}
      <ConfirmDialog
        open={Boolean(
          statusBatch && statusChange
        )}
        title="Change batch status?"
        description={
          statusBatch && statusChange
            ? `Change "${statusBatch.name}" from "${statusBatch.status}" to "${statusChange}"? Existing batch and enrollment history will be preserved.`
            : "Are you sure you want to change this batch's status?"
        }
        confirmText="Change Status"
        cancelText="Keep Status"
        danger={
          statusChange === "cancelled"
        }
        loading={changingStatus}
        onConfirm={() =>
          void confirmStatusChange()
        }
        onCancel={closeStatusDialog}
      />

      {/* Enrollment Removal Confirmation */}
      <ConfirmDialog
        open={Boolean(
          removeEnrollment
        )}
        title="Remove student from batch?"
        description={
          removeEnrollment
            ? `Remove "${
                removeEnrollmentStudent?.full_name ??
                "this student"
              }" from "${
                removeEnrollmentBatch?.name ??
                "this batch"
              }"? The enrollment will be marked as dropped and the history will be preserved.`
            : "Are you sure you want to remove this student from the batch?"
        }
        confirmText="Remove Student"
        cancelText="Keep Student"
        danger
        loading={removingEnrollment}
        onConfirm={() =>
          void confirmRemoveEnrollment()
        }
        onCancel={
          closeRemoveEnrollmentDialog
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