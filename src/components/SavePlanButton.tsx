import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

/** Authentication is checked only at the explicit save boundary; simulations never write to an account. */
export function SavePlanButton({ prepare }: { prepare: () => boolean }) {
  const navigate = useNavigate();
  const trigger = useRef<HTMLButtonElement>(null);
  const [prompt, setPrompt] = useState(false),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        if (prepare()) navigate({ to: "/trips" });
      } else setPrompt(true);
    } catch {
      setPrompt(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button ref={trigger} type="button" disabled={busy} onClick={save}>
        {busy ? "Checking account…" : "Save my whole plan"}
      </Button>
      <Dialog open={prompt} onOpenChange={setPrompt}>
        <DialogContent
          className="max-h-[85svh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus({ preventScroll: true });
          }}
        >
          <DialogHeader>
            <DialogTitle>Keep this adventure for later</DialogTitle>
            <DialogDescription>
              Create a free account to save your travel plans and access them anytime.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your guest plan stays in this browser tab while you explore. Signing in lets you save it
            to your personal trips.
          </p>
          <Button
            onClick={() => {
              if (prepare()) navigate({ to: "/trips" });
            }}
          >
            Sign in or create an account
          </Button>
          <Button variant="outline" onClick={() => setPrompt(false)}>
            Keep exploring as a guest
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
