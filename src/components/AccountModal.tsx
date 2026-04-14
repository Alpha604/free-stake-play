import { useState } from "react";
import { X, User, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  setUsername: (u: string) => void;
  balance: number;
  stats: { totalBets: number; totalWon: number; totalLost: number; gamesPlayed: number };
}

const AccountModal = ({ open, onClose, username, setUsername, balance, stats }: AccountModalProps) => {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(username);

  if (!open) return null;

  const handleSave = () => {
    setUsername(tempName);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Mon Compte</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Username */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <User className="w-8 h-8 text-accent" />
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="bg-accent text-accent-foreground px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div>
                <p className="text-foreground font-bold text-lg">{username}</p>
                <button
                  onClick={() => { setTempName(username); setEditing(true); }}
                  className="text-primary text-sm hover:underline"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="bg-muted rounded-xl p-4 mb-4 border border-border">
          <p className="text-muted-foreground text-sm mb-1">Solde actuel</p>
          <p className="text-2xl font-bold text-foreground">{balance.toFixed(2)} $</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Parties jouées</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.gamesPlayed}</p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Total misé</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalBets.toFixed(2)} $</p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground text-xs">Total gagné</span>
            </div>
            <p className="text-lg font-bold text-accent">{stats.totalWon.toFixed(2)} $</p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground text-xs">Total perdu</span>
            </div>
            <p className="text-lg font-bold text-destructive">{stats.totalLost.toFixed(2)} $</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
