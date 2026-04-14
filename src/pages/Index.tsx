import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MinesGame from "@/components/MinesGame";
import WalletModal from "@/components/WalletModal";

const Index = () => {
  const [balance, setBalance] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);

  const handleDeposit = (amount: number) => {
    setBalance((b) => b + amount);
  };

  const handleWithdraw = (amount: number) => {
    setBalance((b) => Math.max(0, b - amount));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header balance={balance} onOpenWallet={() => setWalletOpen(true)} />
          <MinesGame balance={balance} setBalance={setBalance} />
        </div>
      </div>
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        balance={balance}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
};

export default Index;
