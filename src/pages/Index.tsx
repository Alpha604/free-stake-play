import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MinesGame from "@/components/MinesGame";
import WalletModal from "@/components/WalletModal";
import AccountModal from "@/components/AccountModal";
import HomePage from "@/components/HomePage";

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
  });

  const handleDeposit = (amount: number) => {
    setBalance((b) => b + amount);
  };

  const handleWithdraw = (amount: number) => {
    setBalance((b) => Math.max(0, b - amount));
  };

  const wrappedSetBalance = (val: number | ((prev: number) => number)) => {
    setBalance((prev) => {
      const newVal = typeof val === "function" ? val(prev) : val;
      const diff = newVal - prev;
      if (diff < 0) {
        // Lost / bet placed
        setStats((s) => ({
          ...s,
          totalBets: s.totalBets + Math.abs(diff),
          gamesPlayed: s.gamesPlayed + 1,
        }));
      } else if (diff > 0) {
        // Won
        setStats((s) => ({
          ...s,
          totalWon: s.totalWon + diff,
        }));
      }
      return newVal;
    });
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
            <Route path="/mines" element={<MinesGame balance={balance} setBalance={wrappedSetBalance} />} />
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
