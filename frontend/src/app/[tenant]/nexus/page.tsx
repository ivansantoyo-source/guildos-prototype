export default function NexusPage({ params }: { params: { tenant: string } }) {
  // Mock data for The Nexus based on the blueprint
  const lfgLobbies = [
    { id: "lobby-1", game: "Super Smash Bros. Melee", slots_total: 4, slots_filled: 2, start_time: "Tonight, 8:00 PM" },
    { id: "lobby-2", game: "Halo 2 (System Link)", slots_total: 8, slots_filled: 7, start_time: "Friday, 7:00 PM" },
  ];

  const ghostData = [
    { rank: 1, player: "TRON_99", score: "1,245,500", status: "Active Champion" },
    { rank: 2, player: "NEO_GEO", score: "1,120,000", status: "Knocked to #2" },
    { rank: 3, player: "FLYNN", score: "985,000", status: "Contender" },
  ];

  return (
    <div id="main-content" className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground dark p-8">
      <h1 className="text-5xl font-bold tracking-tight text-primary mb-2 drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
        The Nexus
      </h1>
      <p className="text-lg text-muted-foreground mb-12 italic">
        Welcome to the physical space of {params.tenant}. Find a party or challenge the local legends.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl">
        
        {/* LFG Matchmaker */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-accent-foreground mb-6 border-b border-primary/20 pb-2">LFG Matchmaker</h2>
          <div className="space-y-4">
            {lfgLobbies.map(lobby => (
              <div key={lobby.id} className="p-4 border border-primary/30 bg-card rounded-lg flex justify-between items-center backdrop-blur-sm bg-white/5 dark:bg-black/60">
                <div>
                  <h3 className="text-xl font-bold text-primary">{lobby.game}</h3>
                  <p className="text-sm text-muted-foreground">{lobby.start_time}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="block text-sm text-muted-foreground">Slots</span>
                    <span className="font-mono font-bold text-lg">{lobby.slots_filled} / {lobby.slots_total}</span>
                  </div>
                  <button className="bg-primary text-black px-4 py-2 rounded font-bold hover:bg-primary/80 transition-colors">
                    Join
                  </button>
                </div>
              </div>
            ))}
            <button className="w-full p-4 border border-dashed border-primary/50 text-primary rounded-lg hover:bg-primary/10 transition-colors font-bold uppercase tracking-widest">
              + Initialize Lobby
            </button>
          </div>
        </div>

        {/* Ghost Data Scoreboard */}
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-accent-foreground mb-6 border-b border-primary/20 pb-2">Ghost Data: PAC-MAN (Cab A)</h2>
          <div className="border border-primary/30 bg-card rounded-lg overflow-hidden backdrop-blur-sm bg-white/5 dark:bg-black/60">
            <table className="w-full text-left">
              <thead className="bg-primary/10">
                <tr>
                  <th className="p-4 text-primary font-bold">Rank</th>
                  <th className="p-4 text-primary font-bold">Player Tag</th>
                  <th className="p-4 text-primary font-bold">Score</th>
                  <th className="p-4 text-primary font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 font-mono">
                {ghostData.map((data) => (
                  <tr key={data.rank} className={data.rank === 1 ? 'bg-primary/5' : ''}>
                    <td className="p-4 text-xl">#{data.rank}</td>
                    <td className={`p-4 font-bold ${data.rank === 1 ? 'text-primary' : 'text-foreground'}`}>{data.player}</td>
                    <td className="p-4">{data.score}</td>
                    <td className="p-4 text-sm text-muted-foreground">{data.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
