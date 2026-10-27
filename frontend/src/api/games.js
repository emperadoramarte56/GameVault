// Consume la API de FreeToGame (la misma que usa el sitio Node de la Práctica 1).
// La URL sale del .env del frontend (VITE_GAMES_API_URL).
const GAMES_API_URL =
  import.meta.env.VITE_GAMES_API_URL || "/freetogame/games";

export const CATEGORIES = [
  { key: "shooter", text: "Shooter" },
  { key: "mmorpg", text: "MMORPG" },
  { key: "moba", text: "MOBA" },
  { key: "battle-royale", text: "Battle Royale" },
  { key: "strategy", text: "Estrategia" },
  { key: "racing", text: "Carreras" },
  { key: "sports", text: "Deportes" },
  { key: "fighting", text: "Peleas" },
];

export async function getGamesApi(category, signal) {
  const params = new URLSearchParams({
    category,
    platform: "pc",
    "sort-by": "popularity",
  });

  const response = await fetch(`${GAMES_API_URL}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`FreeToGame respondió con estado ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
