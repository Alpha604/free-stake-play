import { useMemo, useState } from "react";
import { CircleDot, Sparkles } from "lucide-react";

interface KenoGameProps {
  balance: number;
  setBalance: (b: number | ((prev: number) => number)) => void;
  onGameResult: (result: {
    game: "Keno";
    bet: number;
    payout: number;
    won: boolean;
    multiplier: number;
    hits: number;
  }) => void;
}

const PAYOUT_TABLE: Record<number, number[]> = {
  1: [0, 3.96],
  2: [0, 1.9, 5.7],
  3: [0, 1.1, 2.8, 24],
  4: [0, 0.5, 1.8, 5, 80],
  5: [0, 0.4, 1.2, 3.5, 15, 250],
  6: [0, 0, 1, 2, 6, 50, 900],
  7: [0, 0, 0.8, 1.5, 4, 20, 100, 1500],
  8: [0, 0, 0.5, 1.2, 3, 10, 50, 200, 2000],
  9: [0, 0, 0.4, 1, 2.5, 8, 25, 100, 500, 4000],
  10: [0, 0, 0.4, 0.8, 2, 5, 20, 80, 250, 1000, 5000],
};

const TOTAL_NUMBERS = 40;
const DRAW_COUNT = 10;

const KenoGame = ({ balance, setBalance, onGameResult }: KenoGameProps) => {
  const [betAmount, setBetAmount] = useState("1.00");
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [hits, setHits] = useState<number[]>([]);
  const [lastMultiplier, setLastMultiplier] = useState(0);

  const maxSelections = 10;

  const currentTable = useMemo(() => PAYOUT_TABLE[selected.length] ?? [], [selected.length]);

  const toggleNumber = (value: number) => {
    setSelected((prev) => {
      if (prev.includes(value)) return prev.filter((n) => n !== value);
      if (prev.length >= maxSelections) return prev;
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  const clearBoard = () => {
    setSelected([]);
    setDrawn([]);
    setHits([]);
    setLastMultiplier(0);
  };

  const playKeno = () => {
    const bet = parseFloat(betAmount);
    if (selected.length === 0 || isNaN(bet) || bet <= 0 || bet > balance) return;

    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    const draw = shuffled.slice(0, DRAW_COUNT).sort((a, b) => a - b);
    const hitNumbers = selected.filter((n) => draw.includes(n));
    const multiplier = PAYOUT_TABLE[selected.length]?.[hitNumbers.length] ?? 0;
    const payout = bet * multiplier;

    setBalance((prev) => prev - bet + payout);
    setDrawn(draw);
    setHits(hitNumbers);
    setLastMultiplier(multiplier);

    onGameResult({
      game: "Keno",
      bet,
      payout,
      won: payout > 0,
      multiplier,
      hits: hitNumbers.length,
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden max-lg:flex-col">
      <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border bg-card p-4 max-lg:w-full max-lg:border-r-0 max-lg:border-b">
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Keno</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">Choisis jusqu'à 10 numéros</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tirage de 10 boules · gains style Stake Originals.</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mise</label>
            <div className="flex items-center rounded-xl border border-border bg-muted">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none"
              />
              <div className="flex border-l border-border">
                <button onClick={() => setBetAmount(String(Math.max(0, (parseFloat(betAmount) || 0) / 2)))} className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground">½</button>
                <button onClick={() => setBetAmount(String((parseFloat(betAmount) || 0) * 2))} className="border-l border-border px-3 py-3 text-sm text-muted-foreground hover:text-foreground">2×</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted p-3">
              <p className="text-muted-foreground">Sélections</p>
              <p className="mt-1 text-lg font-bold text-foreground">{selected.length}/10</p>
            </div>
            <div className="rounded-xl border border-border bg-muted p-3">
              <p className="text-muted-foreground">Dernier gain</p>
              <p className="mt-1 text-lg font-bold text-accent">{lastMultiplier.toFixed(2)}×</p>
            </div>
          </div>

          <button onClick={playKeno} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
            Jouer Keno
          </button>
          <button onClick={clearBoard} className="w-full rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
            Réinitialiser
          </button>

          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Table des gains</p>
            </div>
            {selected.length > 0 ? (
              <div className="space-y-2 text-sm">
                {currentTable.map((value, hitIndex) => (
                  <div key={hitIndex} className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                    <span className="text-muted-foreground">{hitIndex} hits</span>
                    <span className="font-semibold text-foreground">{value.toFixed(2)}×</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sélectionne des numéros pour afficher les multiplicateurs.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tirage</span>
            <div className="flex flex-wrap gap-2">
              {drawn.length ? drawn.map((n) => (
                <div key={n} className="keno-ball h-10 w-10 rounded-full text-sm font-bold">{n}</div>
              )) : <span className="text-sm text-muted-foreground">Aucun tirage pour le moment</span>}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 md:grid-cols-8 lg:grid-cols-10">
            {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((number) => {
              const isSelected = selected.includes(number);
              const isDrawn = drawn.includes(number);
              const isHit = hits.includes(number);

              return (
                <button
                  key={number}
                  onClick={() => toggleNumber(number)}
                  className={[
                    "aspect-square rounded-2xl border text-sm font-bold transition-all duration-200",
                    isHit
                      ? "keno-hit border-primary/50 bg-primary text-primary-foreground"
                      : isDrawn
                        ? "border-destructive/40 bg-destructive/15 text-foreground"
                        : isSelected
                          ? "border-accent/40 bg-accent text-accent-foreground"
                          : "border-border bg-tile text-foreground hover:-translate-y-0.5 hover:bg-tile-hover",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center gap-1">
                    {isHit && <CircleDot className="h-3.5 w-3.5" />}
                    {number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenoGame;