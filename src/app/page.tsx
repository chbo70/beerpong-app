import Link from "next/link";
import { User, Trophy, BarChart } from "lucide-react";

export default function Home() {
  return (
    <main className="w-full flex flex-col items-center justify-center px-5 py-4">
      <h1 className="text-4xl font-bold mb-10 text-center text-white">
        Dashboard
      </h1>
      <div className="flex flex-col gap-5 w-full items-center">
        <Link
          href="/players"
          className="flex items-center gap-3 w-full md:w-96 bg-green-400 rounded-2xl shadow-md p-5 text-gray-50 text-xl font-semibold hover:bg-green-500 transition"
        >
          <User size={28} />
          Manage Players
        </Link>
        <Link
          href="/tournaments"
          className="flex items-center gap-3 w-full md:w-96 bg-blue-400 rounded-2xl shadow-md p-5 text-xl text-gray-100 font-semibold hover:bg-blue-500 transition"
        >
          <Trophy size={28} />
          Manage Tournaments
        </Link>
        <Link
          href="/statistics"
          className="flex items-center gap-3 w-full md:w-96 bg-sky-400 rounded-2xl shadow-md p-5 text-xl text-gray-100 font-semibold hover:bg-sky-500 transition"
        >
          <BarChart size={28} />
          Player Statistics
        </Link>
      </div>
    </main>
  );
}
