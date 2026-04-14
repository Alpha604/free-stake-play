import { Home, Gem, CircleDot, BarChart3, Bookmark, FileText, Link2, Star, Hash, Key, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/", label: "Accueil" },
  { icon: Gem, path: "/mines", label: "Mines" },
  { icon: CircleDot, path: "/keno", label: "Keno" },
  { icon: BarChart3, path: "/stats", label: "Stats" },
  { icon: Bookmark, path: null, label: "Favoris" },
  { icon: FileText, path: null, label: "Règles" },
  null,
  { icon: Link2, path: null, label: "Affiliés" },
  { icon: Star, path: null, label: "VIP" },
  { icon: Hash, path: null, label: "Blog" },
  { icon: Key, path: null, label: "Provably Fair" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-16 shrink-0 border-r border-border bg-sidebar flex flex-col items-center gap-1 py-4">
      <button className="mb-2 rounded-xl p-3 text-muted-foreground transition-colors hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>
      {navItems.map((item, i) => {
        if (!item) return <div key={i} className="my-2 w-8 border-t border-border" />;
        const Icon = item.icon;
        const isActive = item.path && location.pathname === item.path;
        return (
          <button
            key={i}
            onClick={() => item.path && navigate(item.path)}
            title={item.label}
            className={`rounded-xl p-3 transition-all ${isActive ? "bg-accent text-accent-foreground shadow-[0_0_30px_hsl(var(--accent)/0.25)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"} ${!item.path ? "cursor-not-allowed opacity-40" : ""}`}
            disabled={!item.path}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;