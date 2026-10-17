import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="border-b bg-card/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/trips" className="flex items-center gap-2 font-display text-xl font-semibold">
          <img src="/ai-travel-logo.svg" alt="" className="h-7 w-7" /> AI Travel
        </Link>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
