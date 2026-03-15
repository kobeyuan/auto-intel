export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-slate-900 font-bold tracking-tight">AUTO-INTEL</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Synchronizing Intelligence...</p>
        </div>
      </div>
    </div>
  );
}
