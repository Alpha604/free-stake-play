import { Search, User, Bell, LayoutGrid } from "lucide-react";

interface HeaderProps {
  balance: number;
  onOpenWallet: () => void;
  onOpenAccount: () => void;
  username: string;
}

const Header = ({ balance, onOpenWallet, onOpenAccount, username }: HeaderProps) => {
  return (
    <header className="h-14 bg-sidebar flex items-center justify-between px-4 border-b border-border shrink-0">
      <h1 className="text-xl font-extrabold italic text-foreground tracking-tight">Staker</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-secondary rounded-full px-4 py-1.5 gap-2">
          <span className="text-sm font-semibold text-foreground">
            {balance.toFixed(2)} $
          </span>
        </div>
        <button
          onClick={onOpenWallet}
          className="bg-primary text-primary-foreground px-5 py-1.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Portefeuille
        </button>
        <button className="text-muted-foreground hover:text-foreground p-2"><Search className="w-5 h-5" /></button>
        <button onClick={onOpenAccount} className="text-muted-foreground hover:text-foreground p-2" title={username}>
          <User className="w-5 h-5" />
        </button>
        <button className="text-muted-foreground hover:text-foreground p-2"><Bell className="w-5 h-5" /></button>
        <button className="text-muted-foreground hover:text-foreground p-2"><LayoutGrid className="w-5 h-5" /></button>
      </div>
    </header>
  );
};

export default Header;
