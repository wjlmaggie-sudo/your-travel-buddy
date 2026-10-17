import { authRedirectUrl, publicAsset } from "@/lib/deployment";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Travel" },
      { name: "description", content: "Sign in or create a AI Travel account to save your trips." },
      { property: "og:title", content: "Sign in — AI Travel" },
      { property: "og:description", content: "Access your saved trips." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/trips" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl(window.location.origin) },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/trips" });
        else setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-card">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <img src={publicAsset("ai-travel-logo.svg")} alt="" className="h-7 w-7" /> AI Travel
        </Link>
        {sent ? (
          <p className="mt-6 text-muted-foreground">
            Check your email to confirm your account, then sign in.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <h1 className="text-2xl font-semibold">
              {mode === "in" ? "Welcome back" : "Create your account"}
            </h1>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "in" ? "Sign in" : "Sign up"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
