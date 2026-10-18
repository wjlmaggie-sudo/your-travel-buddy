import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PdfTrip } from "@/lib/trip-pdf";
import { Button } from "./ui/button";

export function DownloadTripPdf({ trip, disabled = false }: { trip: PdfTrip; disabled?: boolean }) {
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<{ url: string; filename: string } | null>(null);
  useEffect(
    () => () => {
      if (file) URL.revokeObjectURL(file.url);
    },
    [file],
  );
  async function download() {
    if (status) return;
    setStatus("Preparing your PDF…");
    try {
      const { downloadTripPdf } = await import("@/lib/trip-pdf");
      const result = await downloadTripPdf(trip, setStatus);
      setFile(result);
      const missing = result.missingPhotos;
      if (missing)
        toast.info(
          `PDF downloaded. ${missing} photo(s) could not be embedded; source links and available information are included.`,
        );
      else toast.success("PDF downloaded with all days, photos and available stories.");
    } catch {
      toast.error("The PDF could not be created. Please try again. Your plan is unchanged.");
    } finally {
      setStatus("");
    }
  }
  return (
    <div className="max-w-xs">
      <Button type="button" variant="outline" disabled={disabled || !!status} onClick={download}>
        {status ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download PDF
      </Button>
      <p role="status" className="mt-1 min-h-8 text-xs text-muted-foreground">
        {status || "All days, photos & available stories · no sign-in needed for guest plans"}
      </p>
      {file && (
        <a href={file.url} download={file.filename} className="text-xs text-secondary underline">
          PDF ready · download again
        </a>
      )}
    </div>
  );
}
