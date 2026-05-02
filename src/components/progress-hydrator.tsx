"use client";

import { useEffect } from "react";
import { useUserProgress } from "@/store/use-user-progress";
import { createClient } from "@/lib/supabase/client";
import { resetHeartsIfNewDay, getUserProgress } from "@/lib/supabase/client-actions";

export const ProgressHydrator = () => {
  const { hydrate, setLoading } = useUserProgress();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        await resetHeartsIfNewDay();

        const data = await getUserProgress();

        if (data) {
          hydrate({
            hearts: data.hearts,
            xp: data.xp,
            streak: data.streak,
            total_correct: data.total_correct ?? 0,
            chapter_correct: data.chapter_correct ?? {},
            last_hearts_reset: data.last_hearts_reset,
          });
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    loadProgress();
  }, [hydrate, setLoading]);

  return null;
};
