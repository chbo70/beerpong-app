"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CreateTournamentModal } from "@/components/tournaments/CreateTournamentModal";
import { TournamentList } from "@/components/tournaments/TournamentList";

export interface Tournament {
  id: string;
  name: string;
  tournament_style: string;
  player_ids: string[];
  created_at: string;
}

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTournaments();
    const channel = setupRealtime();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTournaments() {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error.message);
    } else {
      setTournaments(data);
    }
  }

  function setupRealtime() {
    const channel = supabase
      .channel("tournaments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTournaments((prev) => [payload.new as Tournament, ...prev]);
          }

          if (payload.eventType === "UPDATE") {
            setTournaments((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Tournament) : t
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setTournaments((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return channel;
  }

  function handleTournamentCreated(newTournament: Tournament) {
    setShowModal(false);
    // No need to manually update state, Realtime handles it
  }

  return (
    <main className="bg-gradient py-4 min-h-screen px-4">
      <h1 className="flex justify-center text-3xl font-bold mb-6 text-gray-100">
        Tournaments
      </h1>

      <div className="flex justify-center mb-6">
        <Button onClick={() => setShowModal(true)}>Add Tournament</Button>
      </div>

      <TournamentList tournaments={tournaments} />

      <CreateTournamentModal
        open={showModal}
        onClose={(open) => setShowModal(open)}
        onCreated={handleTournamentCreated}
      />
    </main>
  );
}
