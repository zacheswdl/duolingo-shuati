import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const authPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/callback"];

    if (user && authPaths.includes(pathname)) {
      return NextResponse.redirect(new URL("/learn", request.url));
    }

    const protectedPaths = ["/", "/learn", "/exam", "/mistakes", "/profile", "/lesson", "/admin", "/leaderboard", "/favorites"];
    const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (!user && isProtected) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return supabaseResponse;
  } catch {
    const { pathname } = request.nextUrl;
    const protectedPaths = ["/", "/learn", "/exam", "/mistakes", "/profile", "/lesson", "/admin", "/leaderboard", "/favorites"];
    const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

    if (isProtected) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
