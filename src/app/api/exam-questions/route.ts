import { NextResponse } from "next/server";
import { getExamQuestions } from "@/lib/supabase/actions";

export async function GET() {
  try {
    const questions = await getExamQuestions(100);
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Failed to fetch exam questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
