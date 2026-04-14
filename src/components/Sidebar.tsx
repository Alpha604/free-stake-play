import { Home, Gamepad2, Clock, BarChart3, Bookmark, FileText, Link2, Star, Hash, Gem, Key, Menu } from "lucide-react";

const icons = [
  { icon: Home, active: false, accent: true },
  { icon: Gamepad2, active: true, accent: false },
  { icon: Clock, active: false, accent: false },
  { icon: BarChart3, active: false, accent: false },
  { icon: Bookmark, active: false, accent: false },
  { icon: FileText, active: false, accent: false },
  null, // separator
  { icon: Link2, active: false, accent: false },
  { icon: Star, active: false, accent: false },
  { icon: Hash, active: false, accent: false },
  { icon: Gem, active: false, accent: false },
  { icon: Key, active: false, accent: false },
];

const Sidebar = () => {
  return (
    <div className="w-16 bg-sidebar flex flex-col items-center py-4 gap-1 border-r border-border shrink-0">
      <button className="p-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors mb-2">
        <Menu className="w-5 h-5" />
      </button>
      {icons.map((item, i) => {
        if (!item) return <div key={i} className="my-2 w-8 border-t border-border" />;
        const Icon = item.icon;
        return (
          <button
            key={i}
            className={`p-3 rounded-lg transition-colors ${
              item.accent
                ? "bg-accent text-accent-foreground"
                : item.active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;
