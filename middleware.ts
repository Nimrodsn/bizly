import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = ["/login", "/auth/callback"];
const businessPaths = ["/onboarding", "/settings/business"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || (!isPublic && !businessPaths.some((p) => pathname.startsWith(p))))) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* checked immediately; response cookies handled by updateSession */ },
      },
    });
    const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();
    if (!business && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (business && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/receipts";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/receipts";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
