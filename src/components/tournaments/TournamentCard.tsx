"use client";

import { useRouter } from "next/navigation";
import { Tournament } from "@/app/tournaments/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Gamepad2, Shuffle, Users2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Props {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: Props) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournament.id);

    if (error) {
      toast.error("Failed to delete tournament");
    } else {
      toast.success("Tournament deleted");
      router.refresh();
    }

    setLoading(false);
    setShowDeleteModal(false);
  }

  return (
    <>
      <Card
        onClick={() => router.push(`/tournaments/${tournament.id}`)}
        className="p-4 bg-gray-800 text-gray-100 cursor-pointer hover:bg-gray-700 transition rounded-xl flex flex-col gap-2"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gamepad2 size={18} />
            <h3 className="text-lg font-bold">{tournament.name}</h3>
            <h4 className="text-xs mt-1">
              {new Date(tournament.created_at).toLocaleDateString()}
            </h4>
          </div>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="w-8 h-8"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shuffle size={14} />
          {tournament.tournament_style}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users2 size={14} />
          {tournament.player_ids.length} Players
        </div>
      </Card>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            Are you sure you want to delete <strong>{tournament.name}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
