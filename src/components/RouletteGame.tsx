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
const SPIN_DURATION_MS = 4500;

// ---------- Audio (Web Audio API, no deps) ----------
let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const playTick = (volume = 0.04) => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.07);
};

const playWhoosh = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
};

const playWin = () => {
  const ctx = getCtx();
  if (!ctx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
  });
};

const playLose = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);
};

const RouletteGame = ({ balance, setBalance, onGameResult }: Props) => {
  const [selectedChip, setSelectedChip] = useState(1);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadiusPct, setBallRadiusPct] = useState(44);
  const [history, setHistory] = useState<number[]>([]);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [soundOn, setSoundOn] = useState(true);
  // Auto mode
  const [autoSpins, setAutoSpins] = useState(10);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const autoRunning = useRef(false);
  const savedBetsRef = useRef<PlacedBet[]>([]);
  const tickTimers = useRef<number[]>([]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const playIfOn = useCallback((fn: () => void) => { if (soundOn) fn(); }, [soundOn]);

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

  const runSpin = useCallback((currentBets: PlacedBet[]) => {
    setSpinning(true);
    setResult(null);
    setLastWin(null);
    playIfOn(playWhoosh);

    const winningNumber = Math.floor(Math.random() * 37);
    const idx = WHEEL_ORDER.indexOf(winningNumber);
    const sliceAngle = 360 / WHEEL_ORDER.length;

    // Wheel rotates clockwise; ball rotates counter-clockwise then settles.
    const wheelSpins = 4 + Math.random() * 2;
    const newWheelRotation = wheelRotation + wheelSpins * 360;
    setWheelRotation(newWheelRotation);

    // Ball: counter-rotates and lands aligned with the winning slot in the wheel's frame.
    // Final ball world angle so that (ballAngle - wheelAngle) lines up with slot angle relative to wheel top.
    const slotAngleInWheel = idx * sliceAngle + sliceAngle / 2;
    const ballSpins = 6 + Math.random() * 2;
    const newBallRotation = -ballSpins * 360 + (newWheelRotation - slotAngleInWheel);
    setBallRotation(newBallRotation);

    // Ball radius animates: starts on outer rim, drops inward as it slows.
    setBallRadiusPct(46);
    setTimeout(() => setBallRadiusPct(38), 50);
    setTimeout(() => setBallRadiusPct(34), SPIN_DURATION_MS * 0.55);
    setTimeout(() => setBallRadiusPct(30), SPIN_DURATION_MS * 0.85);

    // Ticking sounds, denser at the end
    tickTimers.current.forEach(t => clearTimeout(t));
    tickTimers.current = [];
    const tickTimes = [0.1, 0.4, 0.7, 1.0, 1.35, 1.7, 2.05, 2.4, 2.7, 2.95, 3.2, 3.45, 3.65, 3.8, 3.95, 4.1, 4.25, 4.35];
    tickTimes.forEach((t, i) => {
      const id = window.setTimeout(() => playIfOn(() => playTick(0.03 + i * 0.002)), t * 1000);
      tickTimers.current.push(id);
    });

    setTimeout(() => {
      setResult(winningNumber);
      setHistory(prev => [winningNumber, ...prev].slice(0, 20));

      let totalPayout = 0;
      for (const b of currentBets) {
        if (betWins(b.bet, winningNumber)) totalPayout += b.amount * betMultiplier(b.bet);
      }

      if (totalPayout > 0) {
        setBalance(prev => prev + totalPayout);
        setLastWin(totalPayout);
        playIfOn(playWin);
      } else {
        playIfOn(playLose);
      }

      const tb = currentBets.reduce((s, b) => s + b.amount, 0);
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
    }, SPIN_DURATION_MS);
  }, [wheelRotation, setBalance, onGameResult, playIfOn]);

  const spin = useCallback(() => {
    if (spinning || bets.length === 0) return;
    runSpin(bets);
  }, [spinning, bets, runSpin]);

  // Auto mode loop
  const startAuto = useCallback(() => {
    if (spinning || autoRunning.current) return;
    if (bets.length === 0) return;
    savedBetsRef.current = bets.map(b => ({ ...b }));
    autoRunning.current = true;
    setAutoRemaining(autoSpins);
    runSpin(bets);
  }, [spinning, bets, autoSpins, runSpin]);

  const stopAuto = useCallback(() => {
    autoRunning.current = false;
    setAutoRemaining(0);
  }, []);

  // After each spin completes, schedule the next auto spin
  useEffect(() => {
    if (spinning) return;
    if (!autoRunning.current) return;
    const remaining = autoRemaining - 1;
    if (remaining <= 0) {
      autoRunning.current = false;
      setAutoRemaining(0);
      return;
    }
    const totalSaved = savedBetsRef.current.reduce((s, b) => s + b.amount, 0);
    if (balance < totalSaved) {
      autoRunning.current = false;
      setAutoRemaining(0);
      return;
    }
    setAutoRemaining(remaining);
    setBalance(prev => prev - totalSaved);
    const replay = savedBetsRef.current.map(b => ({ ...b }));
    setBets(replay);
    const id = window.setTimeout(() => runSpin(replay), 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  useEffect(() => () => { tickTimers.current.forEach(t => clearTimeout(t)); }, []);

  const getBetAmount = (bet: BetType): number => {
    const key = betKey(bet);
    return bets.filter(b => betKey(b.bet) === key).reduce((s, b) => s + b.amount, 0);
  };

  const numberColor = (n: number) => {
    const c = getColor(n);
    if (c === "red") return "bg-red-600 hover:bg-red-500";
    if (c === "green") return "bg-emerald-600 hover:bg-emerald-500";
    return "bg-[hsl(220,30%,14%)] hover:bg-[hsl(220,30%,20%)]";
  };

  const NumberCell = ({ n, className = "" }: { n: number; className?: string }) => {
    const amt = getBetAmount({ type: "number", value: n });
    return (
      <button
        onClick={() => placeBet({ type: "number", value: n })}
        disabled={spinning}
        className={`relative flex items-center justify-center font-bold text-sm border border-white/5 transition-all duration-150 ${numberColor(n)} text-white hover:shadow-[0_0_12px_rgba(56,189,248,0.45)] ${className} disabled:opacity-70`}
      >
        {n}
        {amt > 0 && (
          <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.7)]">
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
        className={`relative flex items-center justify-center font-semibold text-xs border border-white/5 bg-[hsl(220,30%,14%)] hover:bg-[hsl(220,30%,20%)] text-slate-300 hover:text-white hover:shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-all duration-150 ${className} disabled:opacity-70`}
      >
        {label}
        {amt > 0 && (
          <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.7)]">
            {amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}
          </span>
        )}
      </button>
    );
  };

  const row1 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3);
  const row2 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 1);
  const row3 = Array.from({ length: 12 }, (_, i) => (i + 1) * 3 - 2);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-[hsl(222,47%,7%)] to-[hsl(222,47%,4%)]">
      <div className="mx-auto max-w-6xl flex flex-col lg:flex-row gap-4">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="rounded-xl border border-white/5 bg-[hsl(222,47%,9%)] p-4 space-y-4 shadow-[0_0_30px_rgba(15,23,42,0.5)]">
            {/* Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/5 bg-[hsl(222,47%,6%)] p-1">
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === "manual" ? "bg-[hsl(217,91%,60%)] text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]" : "text-slate-400 hover:text-white"}`}
              >
                Manuel
              </button>
              <button
                onClick={() => setMode("auto")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === "auto" ? "bg-[hsl(217,91%,60%)] text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]" : "text-slate-400 hover:text-white"}`}
              >
                Auto
              </button>
            </div>

            {/* Chip Selection */}
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Valeur du Jeton <span className="font-bold text-white">{selectedChip.toLocaleString("fr-FR")}</span>
              </p>
              <div className="flex items-center gap-2">
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all duration-200 ${
                      selectedChip === chip
                        ? "bg-yellow-400 text-black ring-2 ring-yellow-300 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.7)]"
                        : "bg-yellow-700/40 text-yellow-200 hover:bg-yellow-600/60"
                    }`}
                  >
                    {chip >= 1000 ? `${chip / 1000}K` : chip}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setSelectedChip(c => Math.max(1, Math.floor(c / 2)))} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[hsl(222,47%,6%)] hover:bg-[hsl(222,47%,12%)] text-slate-300 border border-white/5">/2</button>
                <button onClick={() => setSelectedChip(c => Math.min(10000, c * 2))} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[hsl(222,47%,6%)] hover:bg-[hsl(222,47%,12%)] text-slate-300 border border-white/5">x2</button>
              </div>
            </div>

            {/* Total Bet */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pari Total</span>
              <span className="font-bold text-white">{totalBet.toFixed(2)} $</span>
            </div>

            {/* Auto controls */}
            {mode === "auto" && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <label className="text-xs text-slate-400">Nombre de tours</label>
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setAutoSpins(n)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${autoSpins === n ? "bg-[hsl(217,91%,60%)] text-white" : "bg-[hsl(222,47%,6%)] text-slate-300 hover:bg-[hsl(222,47%,12%)]"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {autoRunning.current && (
                  <p className="text-xs text-center text-cyan-400">Restants : {autoRemaining}</p>
                )}
              </div>
            )}

            {/* Spin / Auto Button */}
            {mode === "manual" ? (
              <button
                onClick={spin}
                disabled={spinning || bets.length === 0}
                className="w-full py-3 rounded-lg font-bold text-base transition-all duration-200 bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,65%)] hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {spinning ? "En cours..." : "Lancer"}
              </button>
            ) : autoRunning.current ? (
              <button
                onClick={stopAuto}
                className="w-full py-3 rounded-lg font-bold text-base bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all"
              >
                Arrêter
              </button>
            ) : (
              <button
                onClick={startAuto}
                disabled={spinning || bets.length === 0}
                className="w-full py-3 rounded-lg font-bold text-base bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,65%)] hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Démarrer Auto
              </button>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundOn(s => !s)}
              className="w-full py-1.5 rounded text-xs font-semibold bg-[hsl(222,47%,6%)] hover:bg-[hsl(222,47%,12%)] text-slate-300 border border-white/5"
            >
              Son : {soundOn ? "ON 🔊" : "OFF 🔇"}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-[hsl(222,47%,9%)] p-3">
              <p className="text-xs text-slate-400 mb-2">Historique</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((n, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold text-white ${
                      getColor(n) === "red" ? "bg-red-600" : getColor(n) === "green" ? "bg-emerald-600" : "bg-zinc-800"
                    } ${i === 0 ? "ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]" : ""}`}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Win */}
          {lastWin !== null && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center animate-fade-in shadow-[0_0_25px_rgba(16,185,129,0.35)]">
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
            <div className="relative w-56 h-56 md:w-72 md:h-72">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)] blur-xl" />

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-30">
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
              </div>

              {/* Wheel */}
              <div
                className="w-full h-full rounded-full border-[5px] border-yellow-600/50 overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_30px_rgba(0,0,0,0.7)]"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)` : "none",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-full" />
                {WHEEL_ORDER.map((n, i) => {
                  const angle = (i * 360) / WHEEL_ORDER.length;
                  const c = getColor(n);
                  return (
                    <div
                      key={n}
                      className="absolute"
                      style={{ width: "100%", height: "100%", transform: `rotate(${angle}deg)` }}
                    >
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          top: "3%",
                          width: "26px",
                          height: "40px",
                          borderRadius: "3px 3px 0 0",
                          backgroundColor: c === "red" ? "#dc2626" : c === "green" ? "#16a34a" : "#18181b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        <span className="text-white text-[9px] font-bold">{n}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-[#1e1e3a] to-[#0a0a18] border-2 border-yellow-600/50 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                  <div className="text-yellow-400 text-3xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">✦</div>
                </div>
              </div>

              {/* Ball orbit (counter-rotating) */}
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  transform: `rotate(${ballRotation}deg)`,
                  transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)` : "none",
                }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                  style={{
                    top: `${50 - ballRadiusPct}%`,
                    transition: spinning ? `top ${SPIN_DURATION_MS}ms cubic-bezier(0.4, 0, 0.6, 1)` : "top 0.3s ease",
                  }}
                />
              </div>

              {/* Result overlay */}
              {result !== null && !spinning && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl animate-scale-in ${
                    getColor(result) === "red" ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)]" : getColor(result) === "green" ? "bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.8)]" : "bg-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
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
              <div className="grid grid-cols-[40px_repeat(12,1fr)_40px] gap-[2px]">
                <div className="row-span-3">
                  <button
                    onClick={() => placeBet({ type: "number", value: 0 })}
                    disabled={spinning}
                    className="relative w-full h-full flex items-center justify-center font-bold text-sm bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] text-white border border-white/5 rounded-l-md transition-all disabled:opacity-70"
                  >
                    0
                    {getBetAmount({ type: "number", value: 0 }) > 0 && (
                      <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.7)]">
                        {getBetAmount({ type: "number", value: 0 })}
                      </span>
                    )}
                  </button>
                </div>

                {row1.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 3 }} className="h-10" />

                {row2.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 2 }} className="h-10" />

                {row3.map(n => <NumberCell key={n} n={n} className="h-10" />)}
                <OutsideBet label="2:1" bet={{ type: "row2:1", value: 1 }} className="h-10" />
              </div>

              <div className="grid grid-cols-3 gap-[2px] mt-[2px] ml-[42px] mr-[42px]">
                <OutsideBet label="1 to 12" bet={{ type: "dozen", value: 1 }} className="h-9" />
                <OutsideBet label="13 to 24" bet={{ type: "dozen", value: 2 }} className="h-9" />
                <OutsideBet label="25 to 36" bet={{ type: "dozen", value: 3 }} className="h-9" />
              </div>

              <div className="grid grid-cols-6 gap-[2px] mt-[2px] ml-[42px] mr-[42px]">
                <OutsideBet label="1 to 18" bet={{ type: "low" }} className="h-9" />
                <OutsideBet label="Even" bet={{ type: "even" }} className="h-9" />
                <button
                  onClick={() => placeBet({ type: "red" })}
                  disabled={spinning}
                  className="relative h-9 bg-red-600 hover:bg-red-500 hover:shadow-[0_0_12px_rgba(220,38,38,0.5)] border border-white/5 transition-all disabled:opacity-70"
                >
                  {getBetAmount({ type: "red" }) > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.7)]">
                      {getBetAmount({ type: "red" })}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => placeBet({ type: "black" })}
                  disabled={spinning}
                  className="relative h-9 bg-zinc-900 hover:bg-zinc-800 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] border border-white/5 transition-all disabled:opacity-70"
                >
                  {getBetAmount({ type: "black" }) > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black px-1 shadow-[0_0_8px_rgba(250,204,21,0.7)]">
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
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-40"
            >
              ↩ Annuler
            </button>
            <button
              onClick={clearBets}
              disabled={spinning || bets.length === 0}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-40"
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
