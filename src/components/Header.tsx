import { Search, User, Bell, LayoutGrid, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  balance: number;
  onOpenWallet: () => void;
  onOpenAccount: () => void;
  username: string;
}

const pageTitles: Record<string, string> = {
  "/": "Casino",
  "/mines": "Mines",
  "/keno": "Keno",
  "/stats": "Stats",
};

const Header = ({ balance, onOpenWallet, onOpenAccount, username }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] ?? "Staker";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/")} className="text-xl font-extrabold italic tracking-tight text-foreground">Staker</button>
        <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 md:flex">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground md:block"><Search className="h-5 w-5" /></button>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5">
          <span className="text-sm font-bold text-foreground">{balance.toFixed(2)} $</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <button onClick={onOpenWallet} className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Portefeuille</button>
        <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"><Bell className="h-5 w-5" /></button>
        <button onClick={onOpenAccount} className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground" title={username}><User className="h-5 w-5" /></button>
      </div>
    </header>
  );
};

export default Header;