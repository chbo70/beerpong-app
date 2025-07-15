"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  name: string;
  points: number;
  airballs: number;
  bouncers: number;
  bombs: number;
  islands: number;
  games_played: number;
  games_won: number;
  inserted_at: string;
}

export default function StatisticsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();

    const channel = supabase
      .channel("players-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("points", { ascending: false });

    if (error) {
      console.error("Error fetching players:", error.message);
      setPlayers([]);
    } else if (data) {
      setPlayers(data);
    }
    setLoading(false);
  }

  function handleRealtimeUpdate(payload: any) {
    const { eventType, new: newPlayer, old: oldPlayer } = payload;

    setPlayers((currentPlayers) => {
      if (eventType === "INSERT") {
        return [...currentPlayers, newPlayer].sort(
          (a, b) => b.points - a.points
        );
      }

      if (eventType === "UPDATE") {
        return currentPlayers
          .map((player) => (player.id === newPlayer.id ? newPlayer : player))
          .sort((a, b) => b.points - a.points);
      }

      if (eventType === "DELETE") {
        return currentPlayers.filter((player) => player.id !== oldPlayer.id);
      }

      return currentPlayers;
    });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Determine badge winners
  const leaderId = players[0]?.id;
  const mostBouncersId = getMaxBy(players, "bouncers");
  const mostAirballsId = getMaxBy(players, "airballs");
  const mostBombsId = getMaxBy(players, "bombs");
  const mostIslandsId = getMaxBy(players, "islands");

  return (
    <main className="bg-gradient py-2 min-h-screen px-2">
      <h1 className="flex justify-center text-3xl font-bold mb-6 text-gray-100">
        Player Statistics
      </h1>

      {loading ? (
        <p className="text-gray-300 text-center">Loading players...</p>
      ) : players.length === 0 ? (
        <p className="text-gray-300 text-center">No players found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const winRatio =
              player.games_played > 0
                ? ((player.games_won / player.games_played) * 100).toFixed(1)
                : "0";

            return (
              <Card key={player.id} className="bg-gray-700 text-gray-100">
                <CardHeader className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {player.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-400">
                      Joined: {formatDate(player.inserted_at)}
                    </CardDescription>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {player.id === leaderId && (
                        <Badge
                          variant="default"
                          className="bg-yellow-500 text-black"
                        >
                          Leader
                        </Badge>
                      )}
                      {player.id === mostBouncersId && (
                        <Badge variant="secondary">Bounce Master</Badge>
                      )}
                      {player.id === mostAirballsId && (
                        <Badge variant="secondary">Fresh Air Specialist</Badge>
                      )}
                      {player.id === mostBombsId && (
                        <Badge variant="secondary">Bomb Commander</Badge>
                      )}
                      {player.id === mostIslandsId && (
                        <Badge variant="secondary">Island King</Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xl font-bold text-yellow-400">
                    {player.points} pts
                  </div>
                </CardHeader>

                <CardContent className="flex gap-12 justify-center">
                  <Stat
                    icon="💣"
                    label="Bombs"
                    value={player.bombs}
                    color="text-red-500"
                  />
                  <Stat
                    icon="🏝️"
                    label="Islands"
                    value={player.islands}
                    color="text-green-400"
                  />
                  <Stat
                    icon="🪀"
                    label="Bouncers"
                    value={player.bouncers}
                    color="text-blue-400"
                  />
                  <Stat
                    icon="🎯"
                    label="Airballs"
                    value={player.airballs}
                    color="text-pink-400"
                  />
                </CardContent>

                <CardFooter className="flex justify-center text-center font-semibold text-md text-gray-300">
                  Games won: {player.games_won} / {player.games_played} (
                  {winRatio}
                  %)
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

interface StatProps {
  icon: string;
  label: string;
  value: number;
  color?: string;
}
function Stat({ icon, label, value, color = "text-white" }: StatProps) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className={`text-2xl ${color}`}>{icon}</div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

// Helper to get the player with the max of a given field
function getMaxBy(players: Player[], field: keyof Player): string | null {
  if (players.length === 0) return null;

  const maxValue = Math.max(...players.map((p) => p[field] as number));

  if (maxValue <= 0) return null; // Prevent badge for zero

  const winner = players.find((p) => p[field] === maxValue);
  return winner ? winner.id : null;
}
