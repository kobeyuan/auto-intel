import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-black text-slate-200">404</h1>
        <div className="relative -mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Intelligence Not Found</h2>
          <p className="text-slate-600 mb-8">
            The strategic briefing you are looking for does not exist or has been archived.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
