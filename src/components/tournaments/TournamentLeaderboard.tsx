import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
  totalBombs: number;
  totalBouncers: number;
  totalAirballs: number;
  totalIslands: number;
}

interface Props {
  tournamentId: string;
  players: { [id: string]: string };
}

export function TournamentLeaderboard({ tournamentId, players }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [tournamentId]);

  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard_${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "games",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  async function fetchLeaderboard() {
    try {
      const { data: games, error } = await supabase
        .from("games")
        .select("*")
        .eq("tournament_id", tournamentId)
        .not("winner", "is", null); // Only completed games

      if (error) {
        console.error("Error fetching games:", error);
        return;
      }

      // Calculate stats for each player
      const playerStats: { [playerId: string]: LeaderboardEntry } = {};

      // Get all players that participated in at least one game
      const participants = new Set<string>();

      games.forEach((game) => {
        participants.add(game.player1_id);
        participants.add(game.player2_id);
      });

      // Initialize only participating players
      participants.forEach((playerId) => {
        if (players[playerId]) {
          // Check to avoid undefined player names
          playerStats[playerId] = {
            playerId,
            playerName: players[playerId],
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            winPercentage: 0,
            totalBombs: 0,
            totalBouncers: 0,
            totalAirballs: 0,
            totalIslands: 0,
          };
        }
      });

      // Process each game
      games.forEach((game) => {
        const player1Stats = playerStats[game.player1_id];
        const player2Stats = playerStats[game.player2_id];

        if (player1Stats && player2Stats) {
          // Update games played
          player1Stats.gamesPlayed++;
          player2Stats.gamesPlayed++;

          // Update wins/losses
          if (game.winner === game.player1_id) {
            player1Stats.wins++;
            player2Stats.losses++;
          } else {
            player2Stats.wins++;
            player1Stats.losses++;
          }

          // Update detailed stats
          if (game.stats_player1) {
            player1Stats.totalBombs += game.stats_player1.bombs || 0;
            player1Stats.totalBouncers += game.stats_player1.bouncers || 0;
            player1Stats.totalAirballs += game.stats_player1.airballs || 0;
            player1Stats.totalIslands += game.stats_player1.islands || 0;
          }

          if (game.stats_player2) {
            player2Stats.totalBombs += game.stats_player2.bombs || 0;
            player2Stats.totalBouncers += game.stats_player2.bouncers || 0;
            player2Stats.totalAirballs += game.stats_player2.airballs || 0;
            player2Stats.totalIslands += game.stats_player2.islands || 0;
          }
        }
      });

      // Calculate win percentages and sort
      const sortedLeaderboard = Object.values(playerStats)
        .map((player) => ({
          ...player,
          winPercentage:
            player.gamesPlayed > 0
              ? (player.wins / player.gamesPlayed) * 100
              : 0,
        }))
        .sort((a, b) => {
          // Sort by wins first, then by win percentage
          if (a.wins !== b.wins) return b.wins - a.wins;
          return b.winPercentage - a.winPercentage;
        });

      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      console.error("Error calculating leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        Leaderboard
      </h2>

      <div className="space-y-2">
        {leaderboard.map((player, index) => (
          <div
            key={player.playerId}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0
                ? "bg-yellow-900/20 border border-yellow-500/30"
                : "bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {getRankIcon(index)}
              <div>
                <div className="font-semibold text-white">
                  {player.playerName}
                </div>
                <div className="text-sm text-gray-400">
                  {player.wins}W - {player.losses}L (
                  {player.winPercentage.toFixed(1)}%)
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-300">
                Games: {player.gamesPlayed}
              </div>
              <div className="text-xs text-gray-400">
                💣{player.totalBombs} 🪀{player.totalBouncers} 🎯
                {player.totalAirballs} 🏝️{player.totalIslands}
              </div>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No completed games yet
        </div>
      )}
    </div>
  );
}
