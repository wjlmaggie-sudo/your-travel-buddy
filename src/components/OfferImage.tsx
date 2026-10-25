import { useEffect, useState } from "react";
import { CarFront, ImageIcon } from "lucide-react";
/** A reserved media area keeps loading and broken images from shifting the page. */
export function OfferImage({
  src,
  alt,
  vehicle = false,
}: {
  src?: string | null | undefined;
  alt: string;
  vehicle?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className={`relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden ${vehicle ? "bg-white" : "bg-muted/50"}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`h-full w-full ${vehicle ? "object-contain p-5" : "object-cover"}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {vehicle ? (
            <CarFront aria-hidden="true" className="h-14 w-14 opacity-40" />
          ) : (
            <ImageIcon aria-hidden="true" className="h-10 w-10 opacity-40" />
          )}
          <span className="text-xs">Photo unavailable</span>
        </div>
      )}
      {vehicle && src && !failed && (
        <span className="absolute bottom-2 right-3 rounded-full bg-background/90 px-2 py-1 text-[9px] text-muted-foreground">
          Representative model
        </span>
      )}
    </div>
  );
}
