import { redirect } from "next/navigation";
import ExamResultContent from "./result-client";

type Props = {
  searchParams: Promise<{
    correct?: string;
    total?: string;
    xp?: string;
  }>;
};

export default async function ExamResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const correct = params.correct;
  const total = params.total;
  const xp = params.xp;

  // 如果没有参数，重定向到考试页
  if (!correct || !total) {
    redirect("/exam");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <ExamResultContent
        correct={parseInt(correct)}
        total={parseInt(total)}
        xpEarned={parseInt(xp || "0")}
      />
    </div>
  );
}
