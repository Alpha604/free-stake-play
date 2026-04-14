import { useNavigate } from "react-router-dom";
import minesCard from "@/assets/mines-card.webp";
import kenoCard from "@/assets/keno-card.jpg";

const games = [
  {
    id: "mines",
    name: "Mines",
    path: "/mines",
    image: minesCard,
    available: true,
  },
  {
    id: "keno",
    name: "Keno",
    path: "/keno",
    image: kenoCard,
    available: true,
  },
  {
    id: "dice",
    name: "Dice",
    path: "/dice",
    image: minesCard,
    available: false,
  },
  {
    id: "crash",
    name: "Crash",
    path: "/crash",
    image: kenoCard,
    available: false,
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex-1 overflow-y-auto p-5 md:p-7">
      <section className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Casino</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Stake Originals · version démo Staker</p>
        </div>
        <div className="hidden rounded-2xl border border-border bg-card px-4 py-3 md:block">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Jeux en direct</p>
          <p className="mt-1 text-lg font-bold text-foreground">2 disponibles</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Stake Originals</h2>
          <button className="text-sm font-medium text-primary transition-opacity hover:opacity-80">Voir tout</button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && navigate(game.path)}
              disabled={!game.available}
              className="group relative overflow-hidden rounded-[22px] border border-border/80 bg-card text-left shadow-[0_18px_50px_hsl(var(--background)/0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_22px_70px_hsl(var(--primary)/0.18)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={game.name}
            >
              <img
                src={game.image}
                alt={game.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/55 to-transparent px-4 pb-4 pt-16">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-extrabold tracking-tight text-foreground">{game.name}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {game.available ? "Disponible" : "Bientôt"}
                    </p>
                  </div>
                  {game.available && <span className="game-card-pulse" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;