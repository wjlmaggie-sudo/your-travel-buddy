import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { curatedStory, fetchPlaceStory } from "@/lib/place-stories";
import type { VisualPlace } from "@/lib/city-guides";
export function PlaceStory({ place }: { place: VisualPlace }) {
  const [open, setOpen] = useState(false);
  const known = curatedStory(place.name);
  const query = useQuery({
    queryKey: ["place-story", place.source],
    queryFn: ({ signal }) => fetchPlaceStory(place, signal),
    enabled: open && !known,
    staleTime: 86400000,
    retry: false,
  });
  const story = known ?? query.data;
  return (
    <details
      className="mt-3 rounded-lg border bg-secondary/5 p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-xs font-medium text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          The story behind this stop
        </span>
      </summary>
      <div className="mt-2 text-xs leading-relaxed">
        {story ? (
          <>
            <p>{story.text}</p>
            <a
              className="mt-2 inline-block text-secondary underline"
              href={story.source}
              target="_blank"
              rel="noreferrer"
            >
              {story.credit}
            </a>
          </>
        ) : query.isPending && !query.isError ? (
          <p>Finding sourced background…</p>
        ) : (
          <>
            <p>More history is not available for this place yet. {place.description}</p>
            <a
              className="mt-2 inline-block underline"
              href={place.source}
              target="_blank"
              rel="noreferrer"
            >
              Read the place source
            </a>
          </>
        )}
      </div>
    </details>
  );
}
