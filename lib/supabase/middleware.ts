import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/config";

const authRoutes = ["/login", "/signup"];

function isPublicPath(pathname: string) {
  return authRoutes.some((route) => pathname === route);
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) =>
    cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
  );
}

function buildLoginRedirect(request: NextRequest, response: NextResponse) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
  const redirectResponse = NextResponse.redirect(loginUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  let response = NextResponse.next({
    request,
  });
  const publicPath = isPublicPath(request.nextUrl.pathname);
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (!hasAuthCookie) {
    if (publicPath) {
      return response;
    }

    return buildLoginRedirect(request, response);
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null;

  try {
    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser();

    user = authenticatedUser;
  } catch {
    return response;
  }

  if (!user && !publicPath) {
    return buildLoginRedirect(request, response);
  }

  if (user && publicPath) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.searchParams.delete("redirectTo");
    const redirectResponse = NextResponse.redirect(appUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}
