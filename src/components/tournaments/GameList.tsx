import { GameInteraction } from "@/components/tournaments/GameInteraction";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  games: any[];
  tournamentId: string;
  players: { [id: string]: string };
}

export function GameList({
  games: initialGames,
  tournamentId,
  players,
}: Props) {
  const [games, setGames] = useState(initialGames);

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
              game.id === payload.new.id ? payload.new : game
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
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {} as Record<number, any[]>);

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
