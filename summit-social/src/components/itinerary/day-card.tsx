import { Card, CardContent } from "@/components/ui/card";
import type { ItineraryDay } from "@prisma/client";

interface Activity {
  time: string;
  activity: string;
  location: string;
  notes?: string;
}

interface DayCardProps {
  day: ItineraryDay;
}

export function DayCard({ day }: DayCardProps) {
  const activities = day.activities as Activity[];

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold text-gray-900">{day.title}</h3>
        {day.description && <p className="mt-1 text-sm text-gray-600">{day.description}</p>}
        {activities.length > 0 && (
          <ul className="mt-3 space-y-2">
            {activities.map((activity, i) => (
              <li key={`${activity.time}-${i}`} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-gray-400">{activity.time}</span>
                <div>
                  <p className="text-gray-900">{activity.activity}</p>
                  <p className="text-gray-500">{activity.location}</p>
                  {activity.notes && <p className="text-xs text-gray-400">{activity.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
