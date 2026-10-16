export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-68px)] items-center justify-center bg-slate-100 p-6 lg:min-h-screen lg:pt-0">
      <div className="flex flex-col items-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading Startup Manager...
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Please wait
        </p>
      </div>
    </div>
  );
}
