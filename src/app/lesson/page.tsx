"use client";

import { useEffect, useState } from "react";
import { Quiz } from "./quiz";
import { getQuestions } from "@/lib/supabase/actions";
import type { Question } from "@/lib/types";
import { Loader2 } from "lucide-react";

type Props = {
  searchParams: Promise<{ chapter?: string; mode?: string }>;
};

const LessonPage = ({ searchParams }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapter, setChapter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const params = await searchParams;
        
        // 如果是收藏练习模式，从localStorage获取题目
        if (params.mode === "favorites") {
          const stored = localStorage.getItem("favoriteQuestions");
          if (stored) {
            const favoriteQuestions = JSON.parse(stored) as Question[];
            setQuestions(favoriteQuestions);
            localStorage.removeItem("favoriteQuestions");
          } else {
            setQuestions([]);
          }
        } else {
          // 从 Supabase 获取题目
          const data = await getQuestions(params.chapter || "all");
          setQuestions(data);
        }
        setChapter(params.chapter);
      } catch (e) {
        console.error("Failed to load questions:", e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return <Quiz chapter={chapter} questions={questions} />;
};

export default LessonPage;

