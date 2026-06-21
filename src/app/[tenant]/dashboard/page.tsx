export default function DashboardPage({ params }: { params: { tenant: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground dark">
      <h1 className="text-5xl font-bold tracking-tight text-primary mb-8 drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
        Merchant Dashboard
      </h1>
      <p className="text-xl text-muted-foreground mb-12">
        Tenant: <span className="font-mono text-primary">{params.tenant}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-6">
        <div className="p-6 border border-primary/20 bg-card rounded-lg shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/5 dark:bg-black/40">
          <h2 className="text-2xl font-bold text-accent-foreground mb-2">Gold Farmed</h2>
          <p className="text-4xl font-mono text-primary animate-pulse">$1,245.00</p>
        </div>

        <div className="p-6 border border-primary/20 bg-card rounded-lg shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/5 dark:bg-black/40">
          <h2 className="text-2xl font-bold text-accent-foreground mb-2">Legendary Acquired</h2>
          <p className="text-4xl font-mono text-primary">3 Items</p>
        </div>

        <div className="p-6 border border-primary/20 bg-card rounded-lg shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/5 dark:bg-black/40">
          <h2 className="text-2xl font-bold text-destructive mb-2">Loot Depleted</h2>
          <p className="text-4xl font-mono text-destructive">12 Items</p>
        </div>
      </div>
    </div>
  );
}
