import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/app/tournaments/page";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateRoundRobinGames } from "@/lib/tournamentUtils";

interface Player {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: (open: boolean) => void;
  onCreated: (tournament: Tournament) => void;
}

export function CreateTournamentModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState("round-robin");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchPlayers();
    }
  }, [open]);

  async function fetchPlayers() {
    const { data, error } = await supabase.from("players").select("id, name");
    if (error) {
      console.error(error.message);
    } else {
      setPlayers(data);
    }
  }

  async function createTournament() {
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, name")
      .in("id", selectedPlayers);

    if (playerError) {
      console.error(playerError.message);
      return;
    }

    if (!playerData) {
      console.error("No players found");
      return;
    }

    // 1. Create tournament first
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert([
        {
          name,
          tournament_style: style,
          player_ids: selectedPlayers,
        },
      ])
      .select()
      .single();

    if (tournamentError) {
      console.error(tournamentError.message);
      return;
    }

    // 2. Generate games after tournament created
    let games = generateRoundRobinGames(playerData);

    // 3. Map games to include tournament_id and fix field names
    const gamesWithTournamentId = games.map((g) => ({
      tournament_id: tournament.id,
      game_number: g.game_number.toString(), // Convert to string to match schema
      round: g.round,
      player1_id: g.player1_id,
      player2_id: g.player2_id,
      score1: g.score1,
      score2: g.score2,
      stats_player1: g.stats_player1,
      stats_player2: g.stats_player2,
      winner: g.winner_id, // Changed from winner_id to winner to match schema
    }));

    // 4. Insert games
    const { error: gamesError } = await supabase
      .from("games")
      .insert(gamesWithTournamentId);

    if (gamesError) {
      console.error(gamesError.message);
      return;
    }

    onCreated(tournament);
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 rounded-lg space-y-4">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Tournament Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-gray-100"
        >
          <option value="round-robin">Round Robin</option>
          <option value="single-elimination">Single Elimination</option>
        </select>

        <div className="max-h-40 overflow-auto border border-gray-600 rounded p-2 space-y-1">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={
                selectedPlayers.length === players.length && players.length > 0
              }
              ref={(input) => {
                if (input) {
                  input.indeterminate =
                    selectedPlayers.length > 0 &&
                    selectedPlayers.length < players.length;
                }
              }}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPlayers(players.map((p) => p.id));
                } else {
                  setSelectedPlayers([]);
                }
              }}
            />
            Select All
          </label>
          {players.map((player) => (
            <label key={player.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPlayers.includes(player.id)}
                onChange={() => togglePlayer(player.id)}
              />
              {player.name}
            </label>
          ))}
        </div>

        <Button className="w-full mt-2" onClick={createTournament}>
          Create
        </Button>
      </DialogContent>
    </Dialog>
  );
}
