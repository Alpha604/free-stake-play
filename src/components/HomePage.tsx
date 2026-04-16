import { useNavigate } from "react-router-dom";
import minesCard from "@/assets/mines-card.webp";
import kenoCard from "@/assets/keno-card.jpg";
import diceCard from "@/assets/dice-card.jpg";
import plinkoCard from "@/assets/plinko-card.jpg";
import limboCard from "@/assets/limbo-card.jpg";
import blackjackCard from "@/assets/blackjack-card.jpg";
import chickenCard from "@/assets/chicken-card.jpg";
import crashCard from "@/assets/crash-card.jpg";
import dragonTowerCard from "@/assets/dragon-tower-card.jpg";
import hiloCard from "@/assets/hilo-card.jpg";
import wheelCard from "@/assets/wheel-card.jpg";
import flipCard from "@/assets/flip-card.jpg";
import pumpCard from "@/assets/pump-card.jpg";
import snakesCard from "@/assets/snakes-card.jpg";
import rouletteCard from "@/assets/roulette-card.jpg";
import molesCard from "@/assets/moles-card.jpg";

const games = [
  { id: "mines", name: "Mines", path: "/mines", image: minesCard, available: true, players: 3521 },
  { id: "dice", name: "Dice", path: "/dice", image: diceCard, available: false, players: 2608 },
  { id: "plinko", name: "Plinko", path: "/plinko", image: plinkoCard, available: false, players: 1573 },
  { id: "limbo", name: "Limbo", path: "/limbo", image: limboCard, available: false, players: 2226 },
  { id: "blackjack", name: "Blackjack", path: "/blackjack", image: blackjackCard, available: false, players: 1215 },
  { id: "chicken", name: "Chicken", path: "/chicken", image: chickenCard, available: false, players: 682 },
  { id: "keno", name: "Keno", path: "/keno", image: kenoCard, available: true, players: 1411 },
  { id: "moles", name: "Moles", path: "/moles", image: molesCard, available: false, players: 675 },
  { id: "crash", name: "Crash", path: "/crash", image: crashCard, available: false, players: 1419 },
  { id: "dragon-tower", name: "Dragon Tower", path: "/dragon-tower", image: dragonTowerCard, available: false, players: 656 },
  { id: "hilo", name: "Hilo", path: "/hilo", image: hiloCard, available: false, players: 566 },
  { id: "wheel", name: "Wheel", path: "/wheel", image: wheelCard, available: false, players: 291 },
  { id: "flip", name: "Flip", path: "/flip", image: flipCard, available: false, players: 303 },
  { id: "pump", name: "Pump", path: "/pump", image: pumpCard, available: false, players: 269 },
  { id: "snakes", name: "Snakes", path: "/snakes", image: snakesCard, available: false, players: 263 },
  { id: "roulette", name: "Roulette", path: "/roulette", image: rouletteCard, available: true, players: 160 },
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
          <p className="mt-1 text-lg font-bold text-foreground">{games.filter(g => g.available).length} disponibles</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Stake Originals</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && navigate(game.path)}
              disabled={!game.available}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.15)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={game.name}
            >
              <img
                src={game.image}
                alt={game.name}
                loading="lazy"
                width={512}
                height={640}
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10">
                <p className="text-sm font-extrabold uppercase tracking-wide text-white">{game.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Stake Originals</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border/40">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground">
                  {game.players.toLocaleString("fr-FR")} joueurs
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
