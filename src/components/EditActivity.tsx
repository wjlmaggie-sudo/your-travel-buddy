import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EditActivity({
  activity,
  refresh,
}: {
  activity: Tables<"activities">;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: activity.title,
    time: activity.time ?? "",
    location: activity.location ?? "",
    notes: activity.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("activities")
        .update({ ...f, title: f.title.trim() })
        .eq("id", activity.id);
      if (error) throw error;
      setOpen(false);
      refresh();
    } catch {
      toast.error("Could not save activity. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${activity.title}`}
        onClick={() => {
          setF({
            title: activity.title,
            time: activity.time ?? "",
            location: activity.location ?? "",
            notes: activity.notes ?? "",
          });
          setOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor={`title-${activity.id}`}>Activity</Label>
              <Input
                id={`title-${activity.id}`}
                required
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`time-${activity.id}`}>Time</Label>
              <Input
                id={`time-${activity.id}`}
                type="time"
                value={f.time}
                onChange={(e) => setF({ ...f, time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`place-${activity.id}`}>Place</Label>
              <Input
                id={`place-${activity.id}`}
                value={f.location}
                onChange={(e) => setF({ ...f, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`notes-${activity.id}`}>Notes</Label>
              <Textarea
                id={`notes-${activity.id}`}
                value={f.notes}
                onChange={(e) => setF({ ...f, notes: e.target.value })}
              />
            </div>
            <Button disabled={busy}>{busy ? "Saving…" : "Save activity"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
