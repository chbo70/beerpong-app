import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GameInteraction } from "@/components/tournaments/GameInteraction";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  games: any[];
  tournamentId: string;
  players: { [id: string]: string };
}

export function GameCardGrid({
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
      .channel(`games_grid_${tournamentId}`)
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

  const rounds = Object.keys(grouped).sort((a, b) => +a - +b);

  return (
    <Tabs defaultValue={rounds[0]} className="w-full">
      <TabsList className="flex flex-wrap mb-4">
        {rounds.map((round) => (
          <TabsTrigger key={round} value={round}>
            Round {round}
          </TabsTrigger>
        ))}
      </TabsList>

      {rounds.map((round) => (
        <TabsContent key={round} value={round}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[round].map((game) => (
              <GameInteraction
                key={game.id}
                game={game}
                tournamentId={tournamentId}
                players={players}
                cardView={true}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
