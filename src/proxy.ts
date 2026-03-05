import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { buildLoginRedirectPath } from "@/lib/auth/callback-url";

export default async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅在 dashboard 下做快速 cookie 级拦截，避免未登录请求进入受保护区域。
  // 不对 /login 等页面做 cookie 存在即跳转，防止“过期 cookie”造成重定向循环。
  const isDashboardPage = pathname.startsWith("/dashboard");

  // 使用 better-auth 推荐的辅助函数检查会话 cookie
  const sessionCookie = getSessionCookie(request);
  const hasSession = !!sessionCookie;

  // 如果用户未登录但尝试访问仪表盘，则重定向到登录页，并附带回调URL
  if (!hasSession && isDashboardPage) {
    const callbackUrl = `${pathname}${request.nextUrl.search}`;
    const loginUrl = new URL(buildLoginRedirectPath(callbackUrl), request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 其他情况，允许请求继续
  return NextResponse.next();
}

export const config = {
  // 仅在受保护区域运行，减少不必要的中间件开销。
  matcher: ["/dashboard/:path*"],
};
