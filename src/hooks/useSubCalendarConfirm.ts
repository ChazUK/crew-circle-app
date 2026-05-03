import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useCallback, useState } from "react";

type SubCalendarSelection = { externalId: string; label: string };

export function useSubCalendarConfirm(connectionId: Id<"calendarConnections">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setEnabledSubCalendars = useAction(api.calendars.actions.setEnabledSubCalendars);

  const confirmSelection = useCallback(
    async (selected: SubCalendarSelection[]) => {
      setIsLoading(true);
      setError(null);
      try {
        await setEnabledSubCalendars({ connectionId, selections: selected });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [connectionId, setEnabledSubCalendars],
  );

  return { confirmSelection, isLoading, error };
}
