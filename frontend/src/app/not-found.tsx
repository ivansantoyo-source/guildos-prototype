import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-xl p-8 guild-card shadow-[0_0_60px_oklch(0.78_0.2_145/8%)]">
          <h1 className="text-6xl font-bold text-muted-foreground/20 select-none">404</h1>
          <h2 className="text-2xl font-bold text-primary tracking-tight mt-2">
            PAGE NOT FOUND
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mt-4">
            The cartridge you&apos;re looking for isn&apos;t in this console.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg border border-border hover:border-primary/40 transition-all duration-200 hover:scale-105"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
