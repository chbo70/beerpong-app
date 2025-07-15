"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import RegisterForm from "@/components/RegisterForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface Player {
  id: string;
  name: string;
}

export default function ManagePlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  useEffect(() => {
    fetchPlayers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("players-management")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload: RealtimePostgresChangesPayload<Player>) =>
          handleRealtimeUpdate(payload)
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id, name")
      .order("inserted_at", { ascending: true });

    if (error) {
      console.error("Error fetching players:", error.message);
    } else {
      setPlayers(data);
    }
  }

  function handleRealtimeUpdate(
    payload: RealtimePostgresChangesPayload<Player>
  ) {
    const { eventType, new: newPlayer, old: oldPlayer } = payload;

    setPlayers((currentPlayers) => {
      if (eventType === "INSERT") {
        if (newPlayer && currentPlayers.find((p) => p.id === newPlayer.id))
          return currentPlayers;
        return newPlayer
          ? [...currentPlayers, newPlayer].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          : currentPlayers;
      }
      if (eventType === "UPDATE") {
        return newPlayer
          ? currentPlayers
              .map((p) =>
                p.id === newPlayer.id ? { ...p, name: newPlayer.name } : p
              )
              .sort((a, b) => a.name.localeCompare(b.name))
          : currentPlayers;
      }
      if (eventType === "DELETE") {
        return oldPlayer
          ? currentPlayers.filter((p) => p.id !== oldPlayer.id)
          : currentPlayers;
      }
      return currentPlayers;
    });
  }

  async function deletePlayer(id: string) {
    await supabase.from("players").delete().eq("id", id);
    // No need to update state manually, realtime handles it
  }

  async function updatePlayerName(id: string) {
    if (newName.trim() === "") return;

    await supabase.from("players").update({ name: newName }).eq("id", id);
    // No need to update state manually, realtime handles it
    setEditPlayerId(null);
    setNewName("");
  }

  function startEdit(player: Player) {
    setEditPlayerId(player.id);
    setNewName(player.name);
  }

  return (
    <main className="bg-gradient py-4 min-h-screen px-4">
      <h1 className="flex justify-center text-3xl font-bold mb-6 text-gray-100">
        Manage Players
      </h1>

      <RegisterForm />

      <div className="mt-8 space-y-4">
        {players.map((player) => (
          <Card
            key={player.id}
            className="flex flex-row items-center justify-between p-4 bg-gray-800 text-gray-100"
          >
            {editPlayerId === player.id ? (
              <div className="flex items-center gap-2 w-full">
                <User size={24} className="mr-2" />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => updatePlayerName(player.id)}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditPlayerId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <User size={24} className="mr-2" />
                <span className="font-semibold">{player.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(player)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePlayer(player.id)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
