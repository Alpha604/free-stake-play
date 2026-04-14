import { useMemo, useRef, useState } from "react";
import { Bomb, Gem, Sparkles } from "lucide-react";

interface MinesGameProps {
  balance: number;
  setBalance: (b: number | ((prev: number) => number)) => void;
  onGameResult: (result: {
    game: "Mines";
    bet: number;
    payout: number;
    won: boolean;
    multiplier: number;
    hits: number;
  }) => void;
}

type CellState = "hidden" | "gem" | "mine";

const GRID_SIZE = 25;
const HOUSE_EDGE = 0.99;

function calculateMultiplier(revealed: number, mines: number): number {
  if (revealed === 0) return 1;
  let mult = HOUSE_EDGE;
  for (let i = 0; i < revealed; i++) {
    mult *= (GRID_SIZE - i) / (GRID_SIZE - mines - i);
  }
  return Math.floor(mult * 10000) / 10000;
}

function nextMultiplier(revealed: number, mines: number): number {
  return calculateMultiplier(revealed + 1, mines);
}

const MinesGame = ({ balance, setBalance, onGameResult }: MinesGameProps) => {
  const [betAmount, setBetAmount] = useState("1.00");
  const [minesCount, setMinesCount] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<CellState[]>(Array(GRID_SIZE).fill("hidden"));
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoRounds, setAutoRounds] = useState("10");
  const [autoStopProfit, setAutoStopProfit] = useState("");
  const [autoStopLoss, setAutoStopLoss] = useState("");
  const [autoGemsToReveal, setAutoGemsToReveal] = useState("3");
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoRoundsLeft, setAutoRoundsLeft] = useState(0);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);

  const autoRef = useRef(false);
  const autoNetRef = useRef(0);

  const gemsCount = GRID_SIZE - minesCount;
  const currentMultiplier = calculateMultiplier(revealedCount, minesCount);
  const nextMult = nextMultiplier(revealedCount, minesCount);
  const wager = parseFloat(betAmount) || 0;

  const profit = useMemo(
    () => (gameActive ? wager * currentMultiplier - wager : 0),
    [currentMultiplier, gameActive, wager],
  );

  const revealAll = (mines: Set<number>, currentGrid: CellState[]) => {
    const next = [...currentGrid];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (next[i] === "hidden") next[i] = mines.has(i) ? "mine" : "gem";
    }
    setGrid(next);
  };

  const startGame = (overrideBet?: number) => {
    const bet = overrideBet ?? wager;
    if (isNaN(bet) || bet <= 0 || bet > balance) return false;

    const mines = new Set<number>();
    while (mines.size < minesCount) mines.add(Math.floor(Math.random() * GRID_SIZE));

    setBalance((b: number) => b - bet);
    setMinePositions(mines);
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setRevealedCount(0);
    setGameActive(true);
    setGameOver(false);
    setFlashIndex(null);
    return true;
  };

  const finishRound = ({ bet, payout, multiplier, hits }: { bet: number; payout: number; multiplier: number; hits: number }) => {
    onGameResult({
      game: "Mines",
      bet,
      payout,
      won: payout > 0,
      multiplier,
      hits,
    });
  };

  const revealCell = (index: number): "gem" | "mine" | null => {
    if (!gameActive || grid[index] !== "hidden" || gameOver) return null;

    const newGrid = [...grid];
    setFlashIndex(index);

    if (minePositions.has(index)) {
      newGrid[index] = "mine";
      minePositions.forEach((pos) => {
        newGrid[pos] = "mine";
      });
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i] === "hidden") newGrid[i] = "gem";
      }
      setGrid(newGrid);
      setGameOver(true);
      setGameActive(false);
      finishRound({ bet: wager, payout: 0, multiplier: 0, hits: revealedCount });
      return "mine";
    }

    newGrid[index] = "gem";
    const newRevealed = revealedCount + 1;
    setRevealedCount(newRevealed);
    setGrid(newGrid);

    if (newRevealed === gemsCount) {
      const mult = calculateMultiplier(newRevealed, minesCount);
      const payout = wager * mult;
      setBalance((b: number) => b + payout);
      setGameActive(false);
      finishRound({ bet: wager, payout, multiplier: mult, hits: newRevealed });
    }

    return "gem";
  };

  const cashOut = () => {
    if (!gameActive || revealedCount === 0) return;
    const winnings = wager * currentMultiplier;
    setBalance((b: number) => b + winnings);
    revealAll(minePositions, grid);
    setGameActive(false);
    finishRound({ bet: wager, payout: winnings, multiplier: currentMultiplier, hits: revealedCount });
  };

  const randomSelect = () => {
    if (!gameActive) return null;
    const hiddenCells = grid.reduce<number[]>((acc, cell, i) => {
      if (cell === "hidden") acc.push(i);
      return acc;
    }, []);
    if (!hiddenCells.length) return null;
    const randomIndex = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
    return revealCell(randomIndex);
  };

  const runAutoRound = async () => {
    if (!autoRef.current) return;

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > balance) {
      stopAuto();
      return;
    }

    const mines = new Set<number>();
    while (mines.size < minesCount) mines.add(Math.floor(Math.random() * GRID_SIZE));

    setBalance((b: number) => b - bet);
    setMinePositions(mines);
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setRevealedCount(0);
    setGameActive(true);
    setGameOver(false);

    const gemsToReveal = Math.min(parseInt(autoGemsToReveal) || 3, gemsCount);
    let currentGrid = Array(GRID_SIZE).fill("hidden") as CellState[];
    let revealed = 0;
    let payout = 0;
    let multiplier = 0;

    for (let g = 0; g < gemsToReveal; g++) {
      if (!autoRef.current) break;
      await new Promise((r) => setTimeout(r, 220));

      const hidden = currentGrid.reduce<number[]>((acc, cell, i) => {
        if (cell === "hidden") acc.push(i);
        return acc;
      }, []);
      if (!hidden.length) break;

      const pick = hidden[Math.floor(Math.random() * hidden.length)];
      setFlashIndex(pick);

      if (mines.has(pick)) {
        currentGrid[pick] = "mine";
        mines.forEach((pos) => {
          currentGrid[pos] = "mine";
        });
        for (let i = 0; i < GRID_SIZE; i++) if (currentGrid[i] === "hidden") currentGrid[i] = "gem";
        setGrid([...currentGrid]);
        setGameOver(true);
        setGameActive(false);
        finishRound({ bet, payout: 0, multiplier: 0, hits: revealed });
        autoNetRef.current -= bet;
        return;
      }

      currentGrid[pick] = "gem";
      revealed += 1;
      setRevealedCount(revealed);
      setGrid([...currentGrid]);
    }

    if (revealed > 0) {
      multiplier = calculateMultiplier(revealed, minesCount);
      payout = bet * multiplier;
      setBalance((b: number) => b + payout);
      for (let i = 0; i < GRID_SIZE; i++) if (currentGrid[i] === "hidden") currentGrid[i] = mines.has(i) ? "mine" : "gem";
      setGrid([...currentGrid]);
      setGameActive(false);
      finishRound({ bet, payout, multiplier, hits: revealed });
      autoNetRef.current += payout - bet;
    } else {
      finishRound({ bet, payout: 0, multiplier: 0, hits: 0 });
      autoNetRef.current -= bet;
    }

    await new Promise((r) => setTimeout(r, 500));
  };

  const startAuto = async () => {
    autoRef.current = true;
    autoNetRef.current = 0;
    setAutoRunning(true);
    const rounds = parseInt(autoRounds) || 10;
    setAutoRoundsLeft(rounds);

    for (let r = 0; r < rounds; r++) {
      if (!autoRef.current) break;
      setAutoRoundsLeft(rounds - r);
      await runAutoRound();

      const stopProfit = parseFloat(autoStopProfit);
      const stopLoss = parseFloat(autoStopLoss);
      if (!isNaN(stopProfit) && autoNetRef.current >= stopProfit) break;
      if (!isNaN(stopLoss) && autoNetRef.current <= -Math.abs(stopLoss)) break;
    }

    stopAuto();
  };

  const stopAuto = () => {
    autoRef.current = false;
    setAutoRunning(false);
    setAutoRoundsLeft(0);
    setGameActive(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden max-lg:flex-col">
      <div className="w-80 shrink-0 overflow-y-auto border-r border-border bg-card p-4 max-lg:w-full max-lg:border-r-0 max-lg:border-b">
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mines</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">Stake-style multipliers</h1>
          <p className="mt-2 text-sm text-muted-foreground">1% house edge · cashout manuel ou auto.</p>
        </div>

        <div className="mt-4 flex rounded-full bg-secondary p-1">
          <button
            onClick={() => {
              setMode("manual");
              stopAuto();
            }}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Manuel
          </button>
          <button
            onClick={() => setMode("auto")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${mode === "auto" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Auto
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1.5 flex justify-between">
              <label className="text-sm font-medium text-foreground">Montant du pari</label>
              <span className="text-sm text-muted-foreground">{wager.toFixed(2)} $US</span>
            </div>
            <div className="flex items-center rounded-xl border border-border bg-muted">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => !gameActive && setBetAmount(e.target.value)}
                disabled={gameActive || autoRunning}
                className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none"
              />
              <div className="flex border-l border-border">
                <button onClick={() => !gameActive && setBetAmount(String(Math.max(0, wager / 2)))} className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground">½</button>
                <button onClick={() => !gameActive && setBetAmount(String(wager * 2))} className="border-l border-border px-3 py-3 text-sm text-muted-foreground hover:text-foreground">2×</button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mines</label>
            <select
              value={minesCount}
              onChange={(e) => !gameActive && setMinesCount(Number(e.target.value))}
              disabled={gameActive || autoRunning}
              className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted p-3">
              <p className="text-muted-foreground">Gemmes</p>
              <p className="mt-1 text-lg font-bold text-foreground">{gemsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted p-3">
              <p className="text-muted-foreground">Prochain</p>
              <p className="mt-1 text-lg font-bold text-primary">{nextMult.toFixed(4)}×</p>
            </div>
          </div>

          {mode === "auto" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre de tours</label>
                <input type="number" value={autoRounds} onChange={(e) => setAutoRounds(e.target.value)} disabled={autoRunning} className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Gemmes à révéler</label>
                <input type="number" value={autoGemsToReveal} onChange={(e) => setAutoGemsToReveal(e.target.value)} disabled={autoRunning} min="1" max={String(gemsCount)} className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Stop profit</label>
                  <input type="number" value={autoStopProfit} onChange={(e) => setAutoStopProfit(e.target.value)} disabled={autoRunning} placeholder="Optionnel" className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Stop perte</label>
                  <input type="number" value={autoStopLoss} onChange={(e) => setAutoStopLoss(e.target.value)} disabled={autoRunning} placeholder="Optionnel" className="w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none" />
                </div>
              </div>
            </>
          )}

          {mode === "manual" ? (
            !gameActive ? (
              <button onClick={() => startGame()} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">Parier</button>
            ) : (
              <div className="space-y-3">
                <button onClick={cashOut} disabled={revealedCount === 0} className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50">Retrait</button>
                <button onClick={randomSelect} className="w-full rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">Sélection aléatoire</button>
              </div>
            )
          ) : (
            !autoRunning ? (
              <button onClick={startAuto} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">Démarrer Auto</button>
            ) : (
              <button onClick={stopAuto} className="w-full rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90">Arrêter ({autoRoundsLeft} restants)</button>
            )
          )}

          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profit total</span>
              <span className="text-sm font-semibold text-foreground">{currentMultiplier.toFixed(4)}×</span>
            </div>
            <div className="text-2xl font-extrabold text-accent">{profit.toFixed(4)} $US</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-background p-4 md:p-8">
        <div className="w-full max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Stake Originals</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Mines</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {revealedCount} gemmes révélées
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 rounded-[28px] border border-border bg-card/70 p-4 md:p-6">
            {grid.map((cell, i) => (
              <button
                key={i}
                onClick={() => revealCell(i)}
                disabled={!gameActive || cell !== "hidden" || autoRunning}
                className={[
                  "group aspect-square rounded-[18px] border border-border/60 transition-all duration-200",
                  cell === "hidden" ? "mine-tile bg-tile hover:-translate-y-0.5 hover:bg-tile-hover" : "",
                  cell === "gem" ? "mine-tile-revealed border-accent/30 bg-tile-revealed" : "",
                  cell === "mine" ? "mine-tile-bomb border-destructive/40 bg-destructive/15" : "",
                  flashIndex === i ? "ring-2 ring-primary/40" : "",
                ].join(" ")}
              >
                <div className="flex h-full items-center justify-center">
                  {cell === "hidden" && <span className="mine-tile-shine" />}
                  {cell === "gem" && <Gem className="gem-pop h-11 w-11 text-accent" />}
                  {cell === "mine" && <Bomb className="bomb-pop h-11 w-11 text-destructive" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;