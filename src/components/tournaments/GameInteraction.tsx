import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Trophy } from "lucide-react";

interface Props {
  game: any;
  players: { [id: string]: string };
  tournamentId: string;
  cardView?: boolean;
}

export function GameInteraction({
  game,
  players,
  tournamentId,
  cardView = false,
}: Props) {
  const [localGame, setLocalGame] = useState(() => ({
    ...game,
    stats_player1: game.stats_player1 ?? {
      bombs: 0,
      bouncers: 0,
      airballs: 0,
      islands: 0,
    },
    stats_player2: game.stats_player2 ?? {
      bombs: 0,
      bouncers: 0,
      airballs: 0,
      islands: 0,
    },
  }));

  // Update local game when prop changes (real-time updates)
  useEffect(() => {
    setLocalGame({
      ...game,
      stats_player1: game.stats_player1 ?? {
        bombs: 0,
        bouncers: 0,
        airballs: 0,
        islands: 0,
      },
      stats_player2: game.stats_player2 ?? {
        bombs: 0,
        bouncers: 0,
        airballs: 0,
        islands: 0,
      },
    });
  }, [game]);

  function updateStat(playerId: string, stat: string) {
    setLocalGame((prev: any) => {
      const isPlayer1 = playerId === prev.player1_id;
      const statsKey = isPlayer1 ? "stats_player1" : "stats_player2";

      return {
        ...prev,
        [statsKey]: {
          ...prev[statsKey],
          [stat]: prev[statsKey][stat] + 1,
        },
      };
    });
  }

  function setWinner(playerId: string) {
    setLocalGame((prev: any) => ({
      ...prev,
      winner: playerId,
      score1: playerId === prev.player1_id ? 1 : 0,
      score2: playerId === prev.player2_id ? 1 : 0,
    }));
  }

  async function saveGame() {
    try {
      // Fetch previous game state
      const { data: existingGame, error: fetchError } = await supabase
        .from("games")
        .select("winner")
        .eq("id", localGame.id)
        .single();

      if (fetchError) {
        console.error("Fetch game error:", fetchError);
        toast.error("Failed to fetch existing game state");
        return;
      }

      const previousWinner = existingGame.winner;
      const newWinner = localGame.winner;

      const winnerChanged =
        previousWinner && newWinner && previousWinner !== newWinner;
      const isNewGameResult = !previousWinner && newWinner;

      // Replace bombs, bouncers, airballs, islands every time
      await Promise.all([
        supabase.rpc("replace_player_stats", {
          p_player_id: localGame.player1_id,
          p_airballs: localGame.stats_player1.airballs || 0,
          p_bouncers: localGame.stats_player1.bouncers || 0,
          p_bombs: localGame.stats_player1.bombs || 0,
          p_islands: localGame.stats_player1.islands || 0,
        }),
        supabase.rpc("replace_player_stats", {
          p_player_id: localGame.player2_id,
          p_airballs: localGame.stats_player2.airballs || 0,
          p_bouncers: localGame.stats_player2.bouncers || 0,
          p_bombs: localGame.stats_player2.bombs || 0,
          p_islands: localGame.stats_player2.islands || 0,
        }),
      ]);

      // Handle points/wins/games_played manually
      if (winnerChanged) {
        await supabase.rpc("update_points_and_wins", {
          p_player_id: previousWinner,
          p_points_change: -10,
          p_games_won_change: -1,
          p_games_played_change: 0,
        });

        await supabase.rpc("update_points_and_wins", {
          p_player_id: newWinner,
          p_points_change: 10,
          p_games_won_change: 1,
          p_games_played_change: 0,
        });
      } else if (isNewGameResult) {
        await supabase.rpc("update_points_and_wins", {
          p_player_id: localGame.player1_id,
          p_points_change: newWinner === localGame.player1_id ? 10 : 0,
          p_games_won_change: newWinner === localGame.player1_id ? 1 : 0,
          p_games_played_change: 1,
        });

        await supabase.rpc("update_points_and_wins", {
          p_player_id: localGame.player2_id,
          p_points_change: newWinner === localGame.player2_id ? 10 : 0,
          p_games_won_change: newWinner === localGame.player2_id ? 1 : 0,
          p_games_played_change: 1,
        });
      }

      // Save the game itself
      await supabase
        .from("games")
        .update({
          winner: localGame.winner,
          score1: localGame.score1,
          score2: localGame.score2,
          stats_player1: localGame.stats_player1,
          stats_player2: localGame.stats_player2,
        })
        .eq("id", localGame.id);

      toast.success("Game and player stats updated");
    } catch (err) {
      console.error("Unexpected save error:", err);
      toast.error("An unexpected error occurred while saving");
    }
  }

  const commonClasses = cardView
    ? "bg-gray-700 rounded-xl p-4"
    : "bg-gray-800 p-4 rounded-xl";

  return (
    <div className={`${commonClasses} flex flex-col gap-4`}>
      <div className="flex justify-between items-center">
        <PlayerSide
          playerId={localGame.player1_id}
          playerName={players[localGame.player1_id]}
          stats={localGame.stats_player1}
          onStatClick={(stat) => updateStat(localGame.player1_id, stat)}
          isWinner={localGame.winner === localGame.player1_id}
          setWinner={() => setWinner(localGame.player1_id)}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl text-gray-300">
            {localGame.score1} : {localGame.score2}
          </div>
          <div className="text-sm text-gray-400">Round {localGame.round}</div>
        </div>

        <PlayerSide
          playerId={localGame.player2_id}
          playerName={players[localGame.player2_id]}
          stats={localGame.stats_player2}
          onStatClick={(stat) => updateStat(localGame.player2_id, stat)}
          isWinner={localGame.winner === localGame.player2_id}
          setWinner={() => setWinner(localGame.player2_id)}
        />
      </div>

      <Button onClick={saveGame} size="sm">
        Save Game
      </Button>
    </div>
  );
}

interface PlayerSideProps {
  playerId: string;
  playerName: string;
  stats: {
    bombs: number;
    bouncers: number;
    airballs: number;
    islands: number;
  };
  onStatClick: (stat: string) => void;
  isWinner: boolean;
  setWinner: () => void;
}

function PlayerSide({
  playerName,
  stats = { bombs: 0, bouncers: 0, airballs: 0, islands: 0 },
  onStatClick,
  isWinner,
  setWinner,
}: PlayerSideProps) {
  return (
    <div className="flex flex-col gap-1 items-center">
      <button
        onClick={setWinner}
        className={`flex items-center gap-1 text-lg font-semibold px-3 py-1 rounded-lg transition-colors ${
          isWinner
            ? "bg-yellow-600 text-white"
            : "hover:bg-gray-600 text-gray-300"
        }`}
      >
        {playerName}{" "}
        {isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
      </button>
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-1">
        {["bombs", "bouncers", "airballs", "islands"].map((stat) => (
          <Button
            key={stat}
            size="icon"
            variant="secondary"
            onClick={() => onStatClick(stat)}
            className="text-xs"
          >
            {stat === "bombs" && `💣 ${stats[stat] || 0}`}
            {stat === "bouncers" && `🪀 ${stats[stat] || 0}`}
            {stat === "airballs" && `🎯 ${stats[stat] || 0}`}
            {stat === "islands" && `🏝️ ${stats[stat] || 0}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
