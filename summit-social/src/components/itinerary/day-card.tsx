import { Card, CardContent } from "@/components/ui/card";

interface Activity {
  time?: string;
  activity?: string;
  location?: string;
  notes?: string;
}

/**
 * Structural subset of the Prisma ItineraryDay model — lets pages pass
 * `select`-narrowed rows without dragging in relation fields.
 */
export interface ItineraryDayData {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  activities: unknown;
}

interface DayCardProps {
  day: ItineraryDayData;
}

export function DayCard({ day }: DayCardProps) {
  const activities = Array.isArray(day.activities) ? (day.activities as Activity[]) : [];

  return (
    <Card>
      <CardContent>
        <h3 className="font-display uppercase tracking-widest text-stone-100">{day.title}</h3>
        {day.description && <p className="mt-1 text-sm text-stone-400">{day.description}</p>}
        {activities.length > 0 && (
          <ul className="mt-3 space-y-2">
            {activities.map((activity, i) => (
              <li key={`${activity.time}-${i}`} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-stone-600">{activity.time}</span>
                <div>
                  <p className="text-stone-100">{activity.activity}</p>
                  <p className="text-stone-500">{activity.location}</p>
                  {activity.notes && <p className="text-xs text-stone-600">{activity.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
