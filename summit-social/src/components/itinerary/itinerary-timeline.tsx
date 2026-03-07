import type { ItineraryDay } from "@prisma/client";
import { DayCard } from "./day-card";

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="relative space-y-6 pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-summit-200" />
      {sortedDays.map((day) => (
        <div key={day.id} className="relative">
          <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-summit-600 text-xs font-bold text-white">
            {day.dayNumber}
          </div>
          <DayCard day={day} />
        </div>
      ))}
    </div>
  );
}
