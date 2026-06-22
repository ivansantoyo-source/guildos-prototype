export default function BountiesPage({ params }: { params: { tenant: string } }) {
  // Mock data for the Bounty Board based on the architectural blueprint
  const bounties = [
    {
      id: "bounty-1",
      target_item: "Panzer Dragoon Saga (Saturn)",
      base_value: 800.00,
      scarcity_mult: 1.25,
      faction_bonus: "Sega Syndicate"
    },
    {
      id: "bounty-2",
      target_item: "EarthBound (SNES)",
      base_value: 300.00,
      scarcity_mult: 1.15,
      faction_bonus: "Nintendo Nomads"
    },
    {
      id: "bounty-3",
      target_item: "Suikoden II (PS1)",
      base_value: 250.00,
      scarcity_mult: 1.10,
      faction_bonus: "Sony Sentinels"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground dark p-8">
      <h1 className="text-5xl font-bold tracking-tight text-primary mb-2 drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
        The Bounty Board
      </h1>
      <p className="text-lg text-muted-foreground mb-12 italic">
        Fulfill these quests for {params.tenant} to earn massive store credit multipliers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {bounties.map((bounty) => {
          const totalReward = (bounty.base_value * bounty.scarcity_mult).toFixed(2);
          return (
            <div key={bounty.id} className="relative p-6 border border-primary/30 bg-card rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.1)] hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] transition-shadow duration-300 flex flex-col justify-between backdrop-blur-sm bg-white/5 dark:bg-black/60">
              {/* Faction Badge */}
              <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                +10% to {bounty.faction_bonus}
              </div>
              
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-accent-foreground mb-1">{bounty.target_item}</h2>
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  <span>Base Value: ${bounty.base_value.toFixed(2)}</span>
                  <span>Scarcity: {bounty.scarcity_mult}x</span>
                </div>
              </div>

              <div className="pt-4 border-t border-primary/20 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Reward Value</span>
                  <span className="text-3xl font-mono text-primary font-bold">${totalReward}</span>
                </div>
                <button className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary px-4 py-2 rounded font-bold transition-colors">
                  Pledge
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
