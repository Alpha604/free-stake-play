import { Gem } from "lucide-react";
import { useNavigate } from "react-router-dom";

const games = [
  {
    id: "mines",
    name: "Mines",
    description: "Trouvez les gemmes, évitez les mines !",
    icon: Gem,
    path: "/mines",
    color: "from-accent/20 to-accent/5",
    available: true,
  },
  {
    id: "dice",
    name: "Dice",
    description: "Bientôt disponible",
    icon: null,
    path: "/dice",
    color: "from-primary/20 to-primary/5",
    available: false,
  },
  {
    id: "plinko",
    name: "Plinko",
    description: "Bientôt disponible",
    icon: null,
    path: "/plinko",
    color: "from-destructive/20 to-destructive/5",
    available: false,
  },
  {
    id: "crash",
    name: "Crash",
    description: "Bientôt disponible",
    icon: null,
    path: "/crash",
    color: "from-yellow-500/20 to-yellow-500/5",
    available: false,
  },
  {
    id: "limbo",
    name: "Limbo",
    description: "Bientôt disponible",
    icon: null,
    path: "/limbo",
    color: "from-purple-500/20 to-purple-500/5",
    available: false,
  },
  {
    id: "tower",
    name: "Tower",
    description: "Bientôt disponible",
    icon: null,
    path: "/tower",
    color: "from-cyan-500/20 to-cyan-500/5",
    available: false,
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Hero */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-foreground mb-2">
          Bienvenue sur <span className="text-accent">Staker</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Jouez à vos jeux de casino préférés avec de l'argent virtuel.
        </p>
      </div>

      {/* Games Grid */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Jeux</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && navigate(game.path)}
              disabled={!game.available}
              className={`relative group bg-gradient-to-b ${game.color} bg-card border border-border rounded-xl p-6 text-left transition-all hover:scale-[1.02] hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border`}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
                {game.icon ? (
                  <game.icon className="w-7 h-7 text-accent" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">?</span>
                )}
              </div>
              <h4 className="text-foreground font-bold text-lg mb-1">{game.name}</h4>
              <p className="text-muted-foreground text-sm">{game.description}</p>
              {!game.available && (
                <span className="absolute top-3 right-3 bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full font-medium">
                  Bientôt
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Jeux disponibles</p>
          <p className="text-2xl font-bold text-foreground">1</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Jeux à venir</p>
          <p className="text-2xl font-bold text-foreground">5</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Avantage maison</p>
          <p className="text-2xl font-bold text-accent">1%</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
