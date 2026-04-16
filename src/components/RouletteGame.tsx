import { useState, useCallback, useRef, useEffect } from "react";

interface Props {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  onGameResult: (result: { game: string; bet: number; payout: number; won: boolean; multiplier: number; hits: number }) => void;
}

const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

const getColor = (n: number): "green" | "red" | "black" => {
  if (n === 0) return "green";
  return REDS.includes(n) ? "red" : "black";
};

type BetType =
  | { type: "number"; value: number }
  | { type: "red" }
  | { type: "black" }
  | { type: "even" }
  | { type: "odd" }
  | { type: "low" }
  | { type: "high" }
  | { type: "dozen"; value: 1 | 2 | 3 }
  | { type: "column"; value: 1 | 2 | 3 }
  | { type: "row2:1"; value: 1 | 2 | 3 };

interface PlacedBet {
  bet: BetType;
  amount: number;
}

function betKey(b: BetType): string {
  if (b.type === "number") return `n${b.value}`;
  if (b.type === "dozen") return `d${b.value}`;
  if (b.type === "column" || b.type === "row2:1") return `c${b.value}`;
  return b.type;
}

function betWins(bet: BetType, result: number): boolean {
  switch (bet.type) {
    case "number": return bet.value === result;
    case "red": return result !== 0 && REDS.includes(result);
    case "black": return result !== 0 && !REDS.includes(result);
    case "even": return result !== 0 && result % 2 === 0;
    case "odd": return result !== 0 && result % 2 === 1;
    case "low": return result >= 1 && result <= 18;
    case "high": return result >= 19 && result <= 36;
    case "dozen":
      if (bet.value === 1) return result >= 1 && result <= 12;
      if (bet.value === 2) return result >= 13 && result <= 24;
      return result >= 25 && result <= 36;
    case "column":
    case "row2:1":
      return result !== 0 && result % 3 === (bet.value === 3 ? 0 : bet.value === 1 ? 1 : 2);
    default: return false;
  }
}

function betMultiplier(bet: BetType): number {
  switch (bet.type) {
    case "number": return 36;
    case "red": case "black": case "even": case "odd": case "low": case "high": return 2;
    case "dozen": case "column": case "row2:1": return 3;
    default: return 0;
  }
}

const CHIPS = [1, 10, 100, 1000];

const RouletteGame = ({ balance, setBalance, onGameResult }: Props) => {
  const [selectedChip, setSelectedChip] = useState(1);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const wheelRef = useRef<HTMLDivElement>(null);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const placeBet = useCallback((bet: BetType) => {
    if (spinning) return;
    if (balance < selectedChip) return;
    setBalance(prev => prev - selectedChip);
    setBets(prev => {
      const key = betKey(bet);
      const existing = prev.findIndex(b => betKey(b.bet) === key);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], amount: copy[existing].amount + selectedChip };
        return copy;
      }
      return [...prev, { bet, amount: selectedChip }];
    });
  }, [spinning, balance, selectedChip, setBalance]);

  const clearBets = useCallback(() => {
    if (spinning) return;
    const refund = bets.reduce((s, b) => s + b.amount, 0);
    setBalance(prev => prev + refund);
    setBets([]);
  }, [spinning, bets, setBalance]);

  const undoLastBet = useCallback(() => {
    if (spinning || bets.length === 0) return;
    const last = bets[bets.length - 1];
    setBalance(prev => prev + last.amount);
    setBets(prev => prev.slice(0, -1));
  }, [spinning, bets, setBalance]);

  const spin = useCallback(() => {
    if (spinning || bets.length === 0) return;
    setSpinning(true);
    setResult(null);
    setLastWin(null);

    const winningNumber = Math.floor(Math.random() * 37);
    const idx = WHEEL_ORDER.indexOf(winningNumber);
    const sliceAngle = 360 / WHEEL_ORDER.length;
    const targetAngle = 360 - (idx * sliceAngle) - sliceAngle / 2;
    const spins = 5 + Math.random() * 3;
    const finalRotation = wheelRotation + spins * 360 + targetAngle - (wheelRotation % 360);

    setWheelRotation(finalRotation);

    setTimeout(() => {
      setResult(winningNumber);
      setHistory(prev => [winningNumber, ...prev].slice(0, 20));

      let totalPayout = 0;
      for (const b of bets) {
        if (betWins(b.bet, winningNumber)) {
          totalPayout += b.amount * betMultiplier(b.bet);
        }
      }

      if (totalPayout > 0) {
        setBalance(prev => prev + totalPayout);
        setLastWin(totalPayout);
      }

      const tb = bets.reduce((s, b) => s + b.amount, 0);
      onGameResult({
        game: "Roulette",
        bet: tb,
        payout: totalPayout,
        won: totalPayout > 0,
        multiplier: totalPayout > 0 ? totalPayout / tb : 0,
        hits: totalPayout > 0 ? 1 : 0,
      });

      setBets([]);
      setSpinning(false);
    }, 4000);
  }, [spinning, bets, wheelRotation, setBalance, onGameResult]);

  const getBetAmount = (bet: BetType): number => {
    const key = betKey(bet);
    return bets.filter(b => betKey(b.bet) === key).reduce((s, b) => s + b.amount, 0);
  };

  const numberColor = (n: number) => {
    const c = getColor(n);
    if (c === "red") return "bg-red-600 hover:bg-red-500";
    if (c === "green") return "bg-emerald-600 hover:bg-emerald-500";
    return "bg-[hsl(var(--card))] hover:bg-[hsl(220,13%,22%)]";
  };

  const NumberCell = ({ n, className = "" }: { n: number; className?: string }) => {
    const amt = getBetAmount({ type: "number", value: n });
    return (
      <button
        onClick={() => placeBet({ type: "number", value: n })}
        disabled={spinning}
        className={`relative flex items-center justify-center font-bold text-sm border border-border/30 transition-all duration-150 ${numberColor(n)} text-white ${className} disabled:opacity-70`}
      >
        {n}
        {amt > 0 && (
          <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black px-1">
            {amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}
          </span>
        )}
      </button>
    );
  };

  const OutsideBet = ({ label, bet, className = "" }: { label: string; bet: BetType; className?: string }) => {
    const amt = getBetAmount(bet);
    return (
      <button
        onClick={() => placeBet(bet)}
        disabled={spinning}
        className={`relative flex items-center justify-center font-semibold text-xs border border-border/30 bg-[hsl(var(--card))] hover:bg-[hsl(220,13%,22%)] text-muted-foreground transition-all duration-150 ${className} disabled:opacity-70`}
      >
        {label}
        {amt > 0 && (
          <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black px-1">
            {amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}
          </span>
        )}
      </button>
    );
  };

  // Build the 3-row grid: row1 = 3,6,9...36; row2 = 2,5,8...35; row3 = 1,4,7...34
  const row1 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3);
  const row2 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 1);
  const row3 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 2);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl flex flex-col lg:flex-row gap-4">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            {/* Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === "manual" ? "bg-[hsl(var(--card))] text-foreground" : "bg-background text-muted-foreground"}`}
              >
                Manuel
              </button>
              <button
                onClick={() => setMode("auto")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === "auto" ? "bg-[hsl(var(--card))] text-foreground" : "bg-background text-muted-foreground"}`}
              >
                Auto
              </button>
            </div>

            {/* Chip Selection */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Valeur du Jeton <span className="font-bold text-foreground">{selectedChip.toLocaleString("fr-FR")}</span>
              </p>
              <div className="flex items-center gap-2">
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all duration-200 ${
                      selectedChip === chip
                        ? "bg-yellow-500 text-black ring-2 ring-yellow-300 scale-110"
                        : "bg-yellow-700/60 text-yellow-200 hover:bg-yellow-600/70"
                    }`}
                  >
                    {chip >= 1000 ? `${chip / 1000}K` : chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Bet */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pari Total</span>
              <span className="font-bold text-foreground">{totalBet.toFixed(2)} $</span>
            </div>

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={spinning || bets.length === 0}
              className="w-full py-3 rounded-lg font-bold text-base transition-all duration-200 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {spinning ? "En cours..." : "Pari"}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-2">Historique</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((n, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold text-white ${
                      getColor(n) === "red" ? "bg-red-600" : getColor(n) === "green" ? "bg-emerald-600" : "bg-zinc-700"
                    } ${i === 0 ? "ring-2 ring-yellow-400" : ""}`}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Win */}
          {lastWin !== null && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center animate-fade-in">
              <p className="text-xs text-emerald-400">Gain</p>
              <p className="text-xl font-extrabold text-emerald-400">{lastWin.toFixed(2)} $</p>
            </div>
          )}
          {result !== null && lastWin === null && !spinning && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center animate-fade-in">
              <p className="text-xs text-red-400">Perdu</p>
              <p className="text-base font-bold text-red-400">Numéro : {result}</p>
            </div>
          )}
        </div>

        {/* Right Panel - Wheel + Table */}
        <div className="flex-1 space-y-5">
          {/* Roulette Wheel */}
          <div className="flex justify-center">
            <div className="relative w-52 h-52 md:w-64 md:h-64">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400" />
              </div>
              {/* Wheel */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-yellow-600/60 overflow-hidden relative"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? "transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)" : "none",
                }}
              >
                {/* Background */}
                <div className="absolute inset-0 bg-[#1a1a2e] rounded-full" />
                {/* Number slices */}
                {WHEEL_ORDER.map((n, i) => {
                  const angle = (i * 360) / WHEEL_ORDER.length;
                  const c = getColor(n);
                  return (
                    <div
                      key={n}
                      className="absolute"
                      style={{
                        width: "100%",
                        height: "100%",
                        transform: `rotate(${angle}deg)`,
                      }}
                    >
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          top: "4%",
                          width: "24px",
                          height: "36px",
                          borderRadius: "3px 3px 0 0",
                          backgroundColor: c === "red" ? "#dc2626" : c === "green" ? "#16a34a" : "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span className="text-white text-[8px] font-bold">{n}</span>
                      </div>
                    </div>
                  );
                })}
                {/* Center */}
                <div className="absolute inset-[30%] rounded-full bg-[#0f0f1a] border-2 border-yellow-600/40 flex items-center justify-center">
                  <div className="text-yellow-500 text-2xl">✦</div>
                </div>
              </div>
              {/* Result overlay */}
              {result !== null && !spinning && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-2xl animate-scale-in ${
                    getColor(result) === "red" ? "bg-red-600" : getColor(result) === "green" ? "bg-emerald-600" : "bg-zinc-700"
                  }`}>
                    {result}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Betting Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              {/* Grid: Zero + Numbers + 2:1 */}
              <div className="grid grid-cols-[40px_repeat(12,1fr)_40px] gap-[2px]">
                {/* Zero spans 3 rows */}
                <div className="row-span-3">
                  <button
                    onClick={() => placeBet({ type: "number", value: 0 })}
                    disabled={spinning}
                    className="relative w-full h-full flex items-center justify-center font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white border border-border/30 rounded-l-md transition-all disabled:opacity-70"
                  >
                    0
                    {getBetAmount({ type: "number", value: 0 }) > 0 && (
                      <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black px-1">
                        {getBetAmount({ type: "number", value: 0 })}
                      </span>
                    )}
                  </button>
                </div>

                {/* Row 1: 3, 6, 9 ... 36 */}
                {row1.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 3 }} className="h-10" />

                {/* Row 2: 2, 5, 8 ... 35 */}
                {row2.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 2 }} className="h-10" />

                {/* Row 3: 1, 4, 7 ... 34 */}
                {row3.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 1 }} className="h-10" />
              </div>

              {/* Dozens */}
              <div className="grid grid-cols-3 gap-[2px] mt-[2px] ml-[42px] mr-[42px]">
                <OutsideBet label="1 to 12" bet={{ type: "dozen", value: 1 }} className="h-9" />
                <OutsideBet label="13 to 24" bet={{ type: "dozen", value: 2 }} className="h-9" />
                <OutsideBet label="25 to 36" bet={{ type: "dozen", value: 3 }} className="h-9" />
              </div>

              {/* Outside bets row */}
              <div className="grid grid-cols-6 gap-[2px] mt-[2px] ml-[42px] mr-[42px]">
                <OutsideBet label="1 to 18" bet={{ type: "low" }} className="h-9" />
                <OutsideBet label="Even" bet={{ type: "even" }} className="h-9" />
                <button
                  onClick={() => placeBet({ type: "red" })}
                  disabled={spinning}
                  className="relative h-9 bg-red-600 hover:bg-red-500 border border-border/30 transition-all disabled:opacity-70"
                >
                  {getBetAmount({ type: "red" }) > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black px-1">
                      {getBetAmount({ type: "red" })}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => placeBet({ type: "black" })}
                  disabled={spinning}
                  className="relative h-9 bg-zinc-800 hover:bg-zinc-700 border border-border/30 transition-all disabled:opacity-70"
                >
                  {getBetAmount({ type: "black" }) > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black px-1">
                      {getBetAmount({ type: "black" })}
                    </span>
                  )}
                </button>
                <OutsideBet label="Odd" bet={{ type: "odd" }} className="h-9" />
                <OutsideBet label="19 to 36" bet={{ type: "high" }} className="h-9" />
              </div>
            </div>
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={undoLastBet}
              disabled={spinning || bets.length === 0}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              ↩ Annuler
            </button>
            <button
              onClick={clearBets}
              disabled={spinning || bets.length === 0}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              Effacer ↻
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RouletteGame;
