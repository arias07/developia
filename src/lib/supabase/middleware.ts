import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

// Helper to extract locale from pathname
function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/');
  const possibleLocale = segments[1];
  if (locales.includes(possibleLocale as typeof locales[number])) {
    return possibleLocale;
  }
  return null;
}

// Helper to get pathname without locale prefix
function getPathnameWithoutLocale(pathname: string, locale: string): string {
  const withoutLocale = pathname.replace(`/${locale}`, '') || '/';
  return withoutLocale;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip locale handling for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next({ request });
  }

  // Check if pathname has a valid locale
  const pathnameLocale = getLocaleFromPathname(pathname);

  // If no locale in path, redirect to default locale
  if (!pathnameLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Get pathname without locale for route matching
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname, pathnameLocale);

  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Don't write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes (without locale prefix)
  const clientRoutes = ['/dashboard', '/projects', '/settings', '/funnel'];
  const adminRoutes = ['/admin'];
  const authRoutes = ['/login', '/signup', '/forgot-password'];

  const isClientRoute = clientRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathnameWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathnameWithoutLocale.startsWith(route));

  // Redirect unauthenticated users to login
  if (!user && (isClientRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pathnameLocale}/login`;
    url.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pathnameLocale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Check admin access
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['admin', 'project_manager', 'developer', 'designer'];
    if (!profile || !adminRoles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${pathnameLocale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
