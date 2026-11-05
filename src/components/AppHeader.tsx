import { NATIVE_APP } from "@/lib/native-app";
import { publicAsset } from "@/lib/deployment";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppNavigation } from "./AppNavigation";
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
      <div className="app-header">
        <Link to="/" className="app-wordmark">
          <img src={publicAsset("ai-travel-logo.svg")} alt="" className="h-7 w-7" /> AiTravel
        </Link>
        {!NATIVE_APP && <AppNavigation />}
        <Button className="app-header-action" variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
