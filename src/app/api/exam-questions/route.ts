import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("questions").select("*").limit(100);
    if (error) throw new Error(error.message);
    const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
    return NextResponse.json(shuffled);
  } catch (error) {
    console.error("Failed to fetch exam questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
