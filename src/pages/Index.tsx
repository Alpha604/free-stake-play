import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MinesGame from "@/components/MinesGame";
import KenoGame from "@/components/KenoGame";
import StatsPage from "@/components/StatsPage";
import WalletModal from "@/components/WalletModal";
import AccountModal from "@/components/AccountModal";
import HomePage from "@/components/HomePage";
import RouletteGame from "@/components/RouletteGame";

interface GameResult {
  game: "Mines" | "Keno";
  bet: number;
  payout: number;
  won: boolean;
  multiplier: number;
  hits: number;
}

interface RecentGame extends GameResult {
  id: string;
  timestamp: number;
}

const Index = () => {
  const [balance, setBalance] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [username, setUsername] = useState("Joueur");
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
    gamesPlayed: 0,
    biggestWin: 0,
    bestMultiplier: 0,
    recentGames: [] as RecentGame[],
    byGame: {
      Mines: { played: 0, wagered: 0, won: 0 },
      Keno: { played: 0, wagered: 0, won: 0 },
    } as Record<string, { played: number; wagered: number; won: number }>,
  });

  const handleDeposit = (amount: number) => {
    setBalance((b) => b + amount);
  };

  const handleWithdraw = (amount: number) => {
    setBalance((b) => Math.max(0, b - amount));
  };

  const wrappedSetBalance = (val: number | ((prev: number) => number)) => {
    setBalance((prev) => (typeof val === "function" ? val(prev) : val));
  };

  const handleGameResult = (result: GameResult) => {
    setStats((prev) => ({
      ...prev,
      totalBets: prev.totalBets + result.bet,
      totalWon: prev.totalWon + result.payout,
      totalLost: prev.totalLost + Math.max(0, result.bet - result.payout),
      gamesPlayed: prev.gamesPlayed + 1,
      biggestWin: Math.max(prev.biggestWin, result.payout),
      bestMultiplier: Math.max(prev.bestMultiplier, result.multiplier),
      recentGames: [
        {
          ...result,
          id: `${result.game}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
        },
        ...prev.recentGames,
      ].slice(0, 8),
      byGame: {
        ...prev.byGame,
        [result.game]: {
          played: (prev.byGame[result.game]?.played ?? 0) + 1,
          wagered: (prev.byGame[result.game]?.wagered ?? 0) + result.bet,
          won: (prev.byGame[result.game]?.won ?? 0) + result.payout,
        },
      },
    }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header
            balance={balance}
            onOpenWallet={() => setWalletOpen(true)}
            onOpenAccount={() => setAccountOpen(true)}
            username={username}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mines" element={<MinesGame balance={balance} setBalance={wrappedSetBalance} onGameResult={handleGameResult} />} />
            <Route path="/keno" element={<KenoGame balance={balance} setBalance={wrappedSetBalance} onGameResult={handleGameResult} />} />
            <Route path="/roulette" element={<RouletteGame balance={balance} setBalance={wrappedSetBalance} onGameResult={handleGameResult} />} />
            <Route path="/stats" element={<StatsPage balance={balance} stats={stats} />} />
          </Routes>
        </div>
      </div>
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        balance={balance}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        username={username}
        setUsername={setUsername}
        balance={balance}
        stats={stats}
      />
    </div>
  );
};

export default Index;
