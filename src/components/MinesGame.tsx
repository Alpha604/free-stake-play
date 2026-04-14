import { useState, useCallback } from "react";
import { Bomb, Gem } from "lucide-react";

interface MinesGameProps {
  balance: number;
  setBalance: (b: number) => void;
}

type CellState = "hidden" | "gem" | "mine";

const GRID_SIZE = 25; // 5x5

const MinesGame = ({ balance, setBalance }: MinesGameProps) => {
  const [betAmount, setBetAmount] = useState("0.00");
  const [minesCount, setMinesCount] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<CellState[]>(Array(GRID_SIZE).fill("hidden"));
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  const gemsCount = GRID_SIZE - minesCount;
  const currentMultiplier = revealedCount === 0 ? 1 : calculateMultiplier(revealedCount, minesCount);

  function calculateMultiplier(revealed: number, mines: number): number {
    let mult = 1;
    for (let i = 0; i < revealed; i++) {
      mult *= (GRID_SIZE - mines - i) > 0 ? GRID_SIZE / (GRID_SIZE - mines - i) : 1;
    }
    return Math.round(mult * 100) / 100;
  }

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > balance) return;

    // Place mines randomly
    const mines = new Set<number>();
    while (mines.size < minesCount) {
      mines.add(Math.floor(Math.random() * GRID_SIZE));
    }

    setBalance(balance - bet);
    setMinePositions(mines);
    setGrid(Array(GRID_SIZE).fill("hidden"));
    setRevealedCount(0);
    setGameActive(true);
    setGameOver(false);
  };

  const revealCell = (index: number) => {
    if (!gameActive || grid[index] !== "hidden" || gameOver) return;

    const newGrid = [...grid];

    if (minePositions.has(index)) {
      // Hit a mine - reveal all
      newGrid[index] = "mine";
      minePositions.forEach((pos) => {
        newGrid[pos] = "mine";
      });
      // Reveal remaining gems
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i] === "hidden") newGrid[i] = "gem";
      }
      setGrid(newGrid);
      setGameOver(true);
      setGameActive(false);
    } else {
      newGrid[index] = "gem";
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);
      setGrid(newGrid);

      // Check if all gems found
      if (newRevealed === gemsCount) {
        const bet = parseFloat(betAmount);
        const mult = calculateMultiplier(newRevealed, minesCount);
        setBalance(balance + bet * mult);
        setGameActive(false);
      }
    }
  };

  const cashOut = () => {
    if (!gameActive || revealedCount === 0) return;
    const bet = parseFloat(betAmount);
    const winnings = bet * currentMultiplier;
    setBalance(balance + winnings);
    
    // Reveal all
    const newGrid = [...grid];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i] === "hidden") {
        newGrid[i] = minePositions.has(i) ? "mine" : "gem";
      }
    }
    setGrid(newGrid);
    setGameActive(false);
  };

  const randomSelect = () => {
    if (!gameActive) return;
    const hiddenCells = grid.reduce<number[]>((acc, cell, i) => {
      if (cell === "hidden") acc.push(i);
      return acc;
    }, []);
    if (hiddenCells.length === 0) return;
    const randomIndex = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
    revealCell(randomIndex);
  };

  const profit = gameActive ? parseFloat(betAmount) * currentMultiplier - parseFloat(betAmount) : 0;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-card p-4 flex flex-col gap-4 border-r border-border shrink-0">
        {/* Mode Toggle */}
        <div className="flex bg-secondary rounded-full p-1">
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Manuel
          </button>
          <button
            onClick={() => setMode("auto")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === "auto" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Auto
          </button>
        </div>

        {/* Bet Amount */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">Montant du Pari</label>
            <span className="text-sm text-muted-foreground">{(parseFloat(betAmount) || 0).toFixed(2)} $US</span>
          </div>
          <div className="flex items-center bg-muted rounded-lg border border-border">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => !gameActive && setBetAmount(e.target.value)}
              disabled={gameActive}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
            />
            <div className="flex border-l border-border">
              <button
                onClick={() => !gameActive && setBetAmount(String(Math.max(0, (parseFloat(betAmount) || 0) / 2)))}
                className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground border-r border-border"
              >
                ½
              </button>
              <button
                onClick={() => !gameActive && setBetAmount(String((parseFloat(betAmount) || 0) * 2))}
                className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                2×
              </button>
            </div>
          </div>
        </div>

        {/* Mines */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Mines</label>
          <select
            value={minesCount}
            onChange={(e) => !gameActive && setMinesCount(Number(e.target.value))}
            disabled={gameActive}
            className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm outline-none border border-border"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Gems Count */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Gemmes</label>
          <div className="bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border">
            {gemsCount}
          </div>
        </div>

        {/* Action Buttons */}
        {!gameActive ? (
          <button
            onClick={startGame}
            className="w-full bg-accent text-accent-foreground rounded-lg py-3 font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Parier
          </button>
        ) : (
          <>
            <button
              onClick={cashOut}
              disabled={revealedCount === 0}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Retrait
            </button>
            <button
              onClick={randomSelect}
              className="w-full bg-secondary text-foreground rounded-lg py-3 font-bold text-sm hover:bg-muted transition-colors"
            >
              Sélection aléatoire
            </button>
          </>
        )}

        {/* Profit */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm text-muted-foreground">
              Profit total ({currentMultiplier.toFixed(2)}×)
            </span>
            <span className="text-sm text-muted-foreground">{profit.toFixed(2)} $US</span>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border">
            {profit.toFixed(8)}
          </div>
        </div>
      </div>

      {/* Right Panel - Grid */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="grid grid-cols-5 gap-2 max-w-lg w-full">
          {grid.map((cell, i) => (
            <button
              key={i}
              onClick={() => revealCell(i)}
              disabled={!gameActive || cell !== "hidden"}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ${
                cell === "hidden"
                  ? "bg-tile hover:bg-tile-hover cursor-pointer hover:scale-105 active:scale-95"
                  : cell === "gem"
                  ? "bg-tile-revealed"
                  : "bg-destructive/20"
              }`}
            >
              {cell === "gem" && (
                <Gem className="w-10 h-10 text-accent drop-shadow-[0_0_12px_hsl(145,100%,45%)]" />
              )}
              {cell === "mine" && (
                <Bomb className="w-10 h-10 text-destructive" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
