import type { ItineraryDay } from "@prisma/client";
import { DayCard } from "./day-card";

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="relative space-y-6 pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-stone-700" />
      {sortedDays.map((day) => (
        <div key={day.id} className="relative">
          <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center bg-amber-500 text-xs font-mono font-bold text-ink">
            {day.dayNumber}
          </div>
          <DayCard day={day} />
        </div>
      ))}
    </div>
  );
}
