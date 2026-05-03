import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useCallback, useRef, useState } from "react";

type SubCalendarSelection = { externalId: string; label: string };

export function useSubCalendarConfirm(connectionId: Id<"calendarConnections">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(0);

  const setEnabledSubCalendars = useAction(api.calendars.actions.setEnabledSubCalendars);

  const confirmSelection = useCallback(
    async (selected: SubCalendarSelection[]) => {
      inFlight.current += 1;
      setIsLoading(true);
      setError(null);
      try {
        await setEnabledSubCalendars({ connectionId, selections: selected });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        inFlight.current -= 1;
        if (inFlight.current === 0) setIsLoading(false);
      }
    },
    [connectionId, setEnabledSubCalendars],
  );

  return { confirmSelection, isLoading, error };
}
