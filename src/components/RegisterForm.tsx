"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.from("players").insert({ name });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setName("");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto flex flex-col gap-4 text-gray-100"
    >
      <Input
        placeholder="Enter player name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-gray-100 placeholder:text-gray-400"
      />

      <Button type="submit" disabled={loading || name.trim() === ""}>
        <UserPlus size={20} className="mr-2" />
        {loading ? "Registering..." : "Register"}
      </Button>

      {error && <p className="text-red-500 text-center">{error}</p>}
      {success && (
        <p className="text-green-400 text-center">Player registered!</p>
      )}
    </form>
  );
}
