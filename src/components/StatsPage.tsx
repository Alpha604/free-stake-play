import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RecentGame {
  id: string;
  game: string;
  bet: number;
  payout: number;
  won: boolean;
  multiplier: number;
  timestamp: number;
}

interface StatsPageProps {
  balance: number;
  stats: {
    totalBets: number;
    totalWon: number;
    totalLost: number;
    gamesPlayed: number;
    biggestWin: number;
    bestMultiplier: number;
    recentGames: RecentGame[];
    byGame: Record<string, { played: number; wagered: number; won: number }>;
  };
}

const StatsPage = ({ balance, stats }: StatsPageProps) => {
  const chartData = Object.entries(stats.byGame).map(([name, value]) => ({
    name,
    mises: Number(value.wagered.toFixed(2)),
    gains: Number(value.won.toFixed(2)),
    parties: value.played,
  }));

  const net = stats.totalWon - stats.totalLost;

  return (
    <main className="flex-1 overflow-y-auto p-5 md:p-7">
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Statistiques</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vue globale de l'activité du compte Staker.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Solde</p>
          <p className="mt-1 text-xl font-bold text-foreground">{balance.toFixed(2)} $</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Parties", stats.gamesPlayed, "text-foreground"],
          ["Total misé", `${stats.totalBets.toFixed(2)} $`, "text-foreground"],
          ["Plus gros gain", `${stats.biggestWin.toFixed(2)} $`, "text-accent"],
          ["Net", `${net.toFixed(2)} $`, net >= 0 ? "text-accent" : "text-destructive"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Performance par jeu</h2>
              <p className="text-sm text-muted-foreground">Mises et gains cumulés</p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {chartData.length} jeux
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary) / 0.55)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 16,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="mises" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gains" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold text-foreground">Records</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
                <span className="text-muted-foreground">Meilleur multiplicateur</span>
                <span className="font-bold text-primary">{stats.bestMultiplier.toFixed(2)}×</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
                <span className="text-muted-foreground">Total gagné</span>
                <span className="font-bold text-accent">{stats.totalWon.toFixed(2)} $</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
                <span className="text-muted-foreground">Total perdu</span>
                <span className="font-bold text-destructive">{stats.totalLost.toFixed(2)} $</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold text-foreground">Historique récent</h2>
            <div className="mt-4 space-y-3">
              {stats.recentGames.length ? stats.recentGames.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{entry.game}</p>
                    <p className="text-muted-foreground">Mise {entry.bet.toFixed(2)} $ · {entry.multiplier.toFixed(2)}×</p>
                  </div>
                  <span className={entry.won ? "font-bold text-accent" : "font-bold text-destructive"}>
                    {entry.payout.toFixed(2)} $
                  </span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Aucune partie jouée.</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default StatsPage;