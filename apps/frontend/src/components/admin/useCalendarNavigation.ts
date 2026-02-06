import { useCallback } from "react";
import { addDays } from "./utils";
import { useAdminCalendar } from "./hooks/useAdminCalendar";

export function useCalendarNavigation(
  calendar: ReturnType<typeof useAdminCalendar>,
  fireAndForget: (promise: Promise<unknown>) => void
) {
  const onPrevWeek = useCallback(() => {
    const prev = addDays(calendar.calendarWeekStart, -7);
    calendar.setCalendarWeekStart(prev);
    fireAndForget(calendar.loadCalendarData(prev));
  }, [calendar, fireAndForget]);

  const onNextWeek = useCallback(() => {
    const next = addDays(calendar.calendarWeekStart, 7);
    calendar.setCalendarWeekStart(next);
    fireAndForget(calendar.loadCalendarData(next));
  }, [calendar, fireAndForget]);

  return { onPrevWeek, onNextWeek };
}
