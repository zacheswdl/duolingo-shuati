"use client";

import { useEffect } from "react";
import { useUserProgress } from "@/store/use-user-progress";
import { createClient } from "@/lib/supabase/client";

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

        const { data } = await supabase
          .from("user_progress")
          .select("hearts, xp, streak, total_correct, chapter_correct")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          hydrate({
            hearts: data.hearts,
            xp: data.xp,
            streak: data.streak,
            total_correct: data.total_correct ?? 0,
            chapter_correct: data.chapter_correct ?? {},
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
