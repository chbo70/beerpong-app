import { GameInteraction } from "@/components/tournaments/GameInteraction";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface GameStats {
  bombs: number;
  bouncers: number;
  airballs: number;
  islands: number;
}

interface Game {
  id: string;
  tournament_id: string | null;
  game_number: string | null;
  round: number | null;
  player1_id: string | null;
  player2_id: string | null;
  score1: number | null;
  score2: number | null;
  stats_player1: GameStats | null;
  stats_player2: GameStats | null;
  winner: string | null;
  created_at: string | null;
}

interface Props {
  games: Game[];
  tournamentId: string;
  players: { [id: string]: string };
}

export function GameList({
  games: initialGames,
  tournamentId,
  players,
}: Props) {
  const [games, setGames] = useState<Game[]>(initialGames);

  useEffect(() => {
    // Update local games when prop changes
    setGames(initialGames);
  }, [initialGames]);

  useEffect(() => {
    // Set up real-time subscription for this specific tournament
    const channel = supabase
      .channel(`games_${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          setGames((prevGames) =>
            prevGames.map((game) =>
              game.id === (payload.new as Game).id
                ? (payload.new as Game)
                : game
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const grouped = games.reduce((acc, game) => {
    const round = game.round || 1; // Default to round 1 if null
    if (!acc[round]) acc[round] = [];
    acc[round].push(game);
    return acc;
  }, {} as Record<number, Game[]>);

  return (
    <div className="space-y-6">
      {Object.keys(grouped)
        .sort()
        .map((round) => (
          <div key={round}>
            <h3 className="text-xl font-bold mb-2 text-gray-200">
              Round {round}
            </h3>
            <div className="space-y-4">
              {grouped[+round].map((game) => (
                <GameInteraction
                  key={game.id}
                  game={game}
                  tournamentId={tournamentId}
                  players={players}
                  cardView={false}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
