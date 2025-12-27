import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 定义认证相关页面（用户不应在登录状态下访问）
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth/sent");

  // 定义需要认证才能访问的页面
  const isDashboardPage = pathname.startsWith("/dashboard");

  // 使用 better-auth 推荐的辅助函数检查会话 cookie
  const sessionCookie = getSessionCookie(request);
  const hasSession = !!sessionCookie;

  // 如果用户已登录但尝试访问认证页面，则重定向到仪表盘主页
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 如果用户未登录但尝试访问仪表盘，则重定向到登录页，并附带回调URL
  if (!hasSession && isDashboardPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 其他情况，允许请求继续
  return NextResponse.next();
}

export const config = {
  // 中间件仅在以下匹配的路径上运行，以提高性能
  matcher: ["/dashboard/:path*", "/login", "/signup", "/auth/sent"],
};
