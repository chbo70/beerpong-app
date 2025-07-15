import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import { Menu, User, Home, Trophy, BarChart } from "lucide-react";

import Link from "next/link";

export function NavBar() {
  return (
    <header className="w-full fixed  left-0 z-50 px-5 py-4 flex justify-between items-center backdrop-blur-md bg-black/30 border-b border-white/10 text-white">
      <Link href="/" className="text-lg font-bold">
        🍻 Beerpong
      </Link>

      <Sheet>
        <SheetTrigger>
          <Menu size={28} />
        </SheetTrigger>
        <SheetContent side="right" className="bg-black/90 text-gray-100">
          <DialogTitle className="flex justify-center items-center text-lg ml-4 mt-3">
            Menu
          </DialogTitle>

          <div className="flex flex-col ml-4 gap-4 text-lg font-medium">
            <Link href="/">
              <Home size={20} className="inline mr-2" />
              Home
            </Link>
            <Link href="/players">
              <User size={20} className="inline mr-2" />
              Manage Players
            </Link>
            <Link href="/tournaments">
              <Trophy size={20} className="inline mr-2" />
              Manage Tournaments
            </Link>
            <Link href="/statistics">
              <BarChart size={20} className="inline mr-2" />
              Player Statistics
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
