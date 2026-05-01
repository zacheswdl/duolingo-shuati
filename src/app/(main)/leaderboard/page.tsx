"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Icon } from "@/components/Icon";
import { getLeaderboard, getUserRank } from "@/lib/supabase/actions";
import { useUserProgress } from "@/store/use-user-progress";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const { xp: myXp, streak: myStreak } = useUserProgress();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentDisplayName, setCurrentDisplayName] = useState("用户游客");
  const [myRankEntry, setMyRankEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDisplayName = (email?: string | null) => {
    const emailPrefix = email?.split("@")[0]?.slice(0, 6) || "游客";
    return `用户${emailPrefix}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          setCurrentUserId(user.id);
          setCurrentDisplayName(formatDisplayName(user.email));
        }

        const data = await getLeaderboard(50);
        setEntries(data);

        // 如果当前用户在排行榜列表中找不到，单独查询其排名
        if (user && !data.find((e) => e.user_id === user.id)) {
          try {
            const rankEntry = await getUserRank(user.id);
            setMyRankEntry(rankEntry);
          } catch (err) {
            console.error("Failed to load user rank:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Icon name="crown" size={28} />;
    if (rank === 2) return <Icon name="medal" size={28} />;
    if (rank === 3) return <Icon name="medal" size={28} />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300";
    if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300";
    if (rank === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300";
    return "bg-white border-slate-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 justify-center">
          <Icon name="trophy" size={32} />
          排行榜
        </h1>
        <p className="text-slate-400 mt-1">按经验值排名</p>
      </div>

      {/* My stats card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-5 text-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="trophy" size={32} />
            <span className="font-bold">我的排名</span>
          </div>
          <span className="text-3xl font-bold">
            #{entries.find((e) => e.user_id === currentUserId)?.rank || myRankEntry?.rank || "?"}
          </span>

        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
            <Icon name="star" size={24} />
            <span className="font-bold">{myXp.toLocaleString()} XP</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
            <Icon name="flame" size={24} />
            <span className="font-bold">连续打卡 {myStreak} 天</span>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">暂无排行数据</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                getRankBg(entry.rank)
              )}
            >
              {/* Rank */}
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                {getRankIcon(entry.rank) || (
                  <span className="text-lg font-bold text-slate-400">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                {String.fromCharCode(65 + (entry.rank - 1) % 26)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-700 truncate">
                  {entry.display_name || (entry.user_id === currentUserId ? currentDisplayName : `用户${entry.user_id.slice(0, 6)}`)}
                </p>
                <div className="flex items-center gap-2 text-sm flex-wrap mt-1">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-orange-50 border border-orange-100 px-2.5 py-1 text-orange-500 font-semibold">
                    <Icon name="flame" size={20} />
                    连续打卡 {entry.streak} 天
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-sky-50 border border-sky-100 px-2.5 py-1 text-sky-600 font-semibold">
                    <Icon name="target" size={20} />
                    模拟考试最高分 {entry.max_exam_score ?? 0}
                  </span>
                </div>
              </div>

              {/* XP */}
              <div className="shrink-0">
                <div className="inline-flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-100 px-3 py-1.5">
                  <Icon name="star" size={24} />
                  <span className="font-bold text-amber-600">{entry.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
