import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-white/10 select-none">404</h1>
        <h2 className="text-2xl font-bold text-emerald-400 tracking-tight">
          PAGE NOT FOUND
        </h2>
        <p className="text-white/50 max-w-md mx-auto leading-relaxed">
          The cartridge you&apos;re looking for isn&apos;t in this console.
        </p>
        <div className="inline-block">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
