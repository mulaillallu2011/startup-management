import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-68px)] items-center justify-center bg-slate-100 px-4 py-10 lg:min-h-screen">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
          404
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          The dashboard page you are looking for does not exist or may have
          been moved.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}