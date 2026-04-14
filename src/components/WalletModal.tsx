import { useState } from "react";
import { X } from "lucide-react";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
}

const WalletModal = ({ open, onClose, balance, onDeposit, onWithdraw }: WalletModalProps) => {
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  if (!open) return null;

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    if (tab === "deposit") {
      onDeposit(val);
    } else {
      onWithdraw(val);
    }
    setAmount("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Portefeuille</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">Solde actuel</p>
          <p className="text-3xl font-bold text-foreground">{balance.toFixed(2)} $</p>
        </div>

        <div className="flex bg-secondary rounded-lg p-1 mb-4">
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "deposit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Déposer
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "withdraw" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Retirer
          </button>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Montant en $"
          className="w-full bg-muted text-foreground rounded-lg px-4 py-3 mb-4 outline-none border border-border focus:border-primary text-sm"
        />

        <div className="flex gap-2 mb-4">
          {[10, 50, 100, 500].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="flex-1 bg-secondary text-foreground rounded-lg py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {v}$
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity"
        >
          {tab === "deposit" ? "Déposer" : "Retirer"}
        </button>
      </div>
    </div>
  );
};

export default WalletModal;
