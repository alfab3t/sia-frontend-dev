import { NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";
const SSO_PATH = "/auth/sso";
const PROTECTED_PAGES_PATH = "/pages";
const UNAUTHORIZED_PATH = "/auth/sso";
const ROOT_PATH = "/";

const COOKIE_JWT = "jwtToken";
const COOKIE_SSO = "ssoData";
const COOKIE_USER_DATA = "userData";
const COOKIE_PERMISSIONS = "permissionData";

const normalize = (str) => str.replaceAll(/[-_]/g, "").toLowerCase();

function getPermissionsSet(cookies) {
  const cookie = cookies.get(COOKIE_PERMISSIONS);
  if (!cookie) return new Set();

  try {
    const permissions = JSON.parse(cookie.value);
    return new Set(permissions.map((p) => normalize(p.split(".")[0])));
  } catch {
    return new Set();
  }
}

function hasModuleAccess(pathname, permissionsSet) {
  const pathSegments = pathname.split("/").filter(Boolean);
  return pathSegments.some((segment) => permissionsSet.has(normalize(segment)));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const ssoUrl = new URL(SSO_PATH, request.url);
  const unauthorizedUrl = new URL(UNAUTHORIZED_PATH, request.url);

  const hasJwt = request.cookies.has(COOKIE_JWT);
  const hasSso = request.cookies.has(COOKIE_SSO);
  const hasUser = request.cookies.has(COOKIE_USER_DATA);
  const isAuthenticated = hasJwt && hasSso;
  const isFullyAuthenticated = isAuthenticated && hasUser;

  if (pathname === ROOT_PATH) {
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(LOGIN_PATH)) {
    return isAuthenticated
      ? NextResponse.redirect(ssoUrl)
      : NextResponse.next();
  }

  if (pathname.startsWith(SSO_PATH)) {
    return isAuthenticated
      ? NextResponse.next()
      : NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(PROTECTED_PAGES_PATH)) {
    if (!isFullyAuthenticated) {
      return NextResponse.redirect(loginUrl);
    }

    const allowedModules = getPermissionsSet(request.cookies);
    const isAllowed = hasModuleAccess(pathname, allowedModules);

    if (!isAllowed) {
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
