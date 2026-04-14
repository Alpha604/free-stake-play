import { Home, Gamepad2, Clock, BarChart3, Bookmark, FileText, Link2, Star, Hash, Gem, Key, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/", label: "Accueil" },
  { icon: Gamepad2, path: "/mines", label: "Mines" },
  { icon: Clock, path: null, label: "Historique" },
  { icon: BarChart3, path: null, label: "Stats" },
  { icon: Bookmark, path: null, label: "Favoris" },
  { icon: FileText, path: null, label: "Règles" },
  null, // separator
  { icon: Link2, path: null, label: "Affiliés" },
  { icon: Star, path: null, label: "VIP" },
  { icon: Hash, path: null, label: "Blog" },
  { icon: Gem, path: null, label: "Récompenses" },
  { icon: Key, path: null, label: "Provably Fair" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-16 bg-sidebar flex flex-col items-center py-4 gap-1 border-r border-border shrink-0">
      <button className="p-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors mb-2">
        <Menu className="w-5 h-5" />
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
            className={`p-3 rounded-lg transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            } ${!item.path ? "opacity-40 cursor-not-allowed" : ""}`}
            disabled={!item.path}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;
