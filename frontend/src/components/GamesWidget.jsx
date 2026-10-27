import { useEffect, useState } from "react";
import { Loader, Message } from "semantic-ui-react";
import { CATEGORIES, getGamesApi } from "../api/games";
import "./GamesWidget.scss";

const MAX_GAMES = 6;

export function GamesWidget() {
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getGamesApi(category, controller.signal)
      .then((data) => setGames(data.slice(0, MAX_GAMES)))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setGames([]);
        setError(
          "No se pudieron cargar los juegos de FreeToGame. Revisa tu conexión e inténtalo de nuevo."
        );
        console.error("Error en el widget de juegos:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category]);

  return (
    <section className="games-widget">
      <header className="games-widget__header">
        <div>
          <h3>Juegos gratis populares</h3>
          <small>Datos en vivo de FreeToGame</small>
        </div>
        <select
          aria-label="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.text}
            </option>
          ))}
        </select>
      </header>

      {loading && <Loader active inline="centered" content="Cargando..." />}

      {!loading && error && <Message negative content={error} />}

      {!loading && !error && games.length === 0 && (
        <Message info content="No hay juegos para esta categoría." />
      )}

      {!loading && !error && games.length > 0 && (
        <ul className="games-widget__grid">
          {games.map((game) => (
            <li key={game.id} className="games-widget__card">
              <img src={game.thumbnail} alt={game.title} loading="lazy" />
              <div className="games-widget__body">
                <strong>{game.title}</strong>
                <span>
                  {game.genre} · {game.platform}
                </span>
                <p>{game.short_description}</p>
                <a href={game.game_url} target="_blank" rel="noreferrer">
                  Jugar gratis
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
