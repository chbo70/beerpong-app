"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { GameList } from "@/components/tournaments/GameList";
import { GameCardGrid } from "@/components/tournaments/GameCardGrid";
import { TournamentLeaderboard } from "@/components/tournaments/TournamentLeaderboard";

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [players, setPlayers] = useState<{ [id: string]: string }>({});
  const [cardView, setCardView] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchTournament();
    fetchGames();
    fetchPlayers();

    // Set up real-time subscription for the main tournament page
    const channel = supabase
      .channel(`tournament_main_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `tournament_id=eq.${id}`,
        },
        (payload) => {
          // Update games state when any game is updated
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
  }, [id]);

  async function fetchTournament() {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    setTournament(data);
  }

  async function fetchGames() {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("tournament_id", id)
      .order("game_number", { ascending: true });

    setGames(data ?? []);
  }

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("id, name");
    const map = Object.fromEntries((data ?? []).map((p) => [p.id, p.name]));
    setPlayers(map);
  }

  if (!tournament) {
    return (
      <p className="text-gray-300 text-center mt-10">Loading tournament...</p>
    );
  }

  return (
    <main className="bg-gradient min-h-screen px-4 py-6 text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Tournament Header */}
        <div className="grid grid-cols-2 justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <p className="text-sm text-gray-400 mb-4">
              {tournament.tournament_style} · {tournament.player_ids.length}{" "}
              Players
            </p>
          </div>
          <div className="flex justify-end items-end">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showLeaderboard ? "Leaderboard" : "Leaderboard"}
              </button>
            </div>
          </div>
          <div className="col-span-2">
            {showLeaderboard && (
              <div className="mb-6">
                <TournamentLeaderboard
                  tournamentId={id as string}
                  players={players}
                />
              </div>
            )}
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Games View Controls */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm">List View</span>
          <Switch checked={cardView} onCheckedChange={setCardView} />
          <span className="text-sm">Card View</span>
        </div>

        {/* Games Display */}
        {cardView ? (
          <GameCardGrid
            games={games}
            tournamentId={id as string}
            players={players}
          />
        ) : (
          <GameList
            games={games}
            tournamentId={id as string}
            players={players}
          />
        )}
      </div>
    </main>
  );
}
