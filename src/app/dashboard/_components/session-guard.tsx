"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import Loading from "@/app/loading"; // 复用现有的加载组件

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. 等待会话状态加载完成
    if (isPending) {
      return;
    }

    // 2. 加载完成但会话不存在，并且当前在受保护的 dashboard 路径下
    if (!session && pathname.startsWith("/dashboard")) {
      toast.error("Your session has expired. Please log in again.");
      router.push("/login"); // 重定向到登录页
    }
  }, [session, isPending, router, pathname]);

  // 3. 在等待验证时，显示全局的加载动画，防止内容闪烁
  if (isPending) {
    return <Loading />;
  }

  // 4. 会话有效，渲染子组件
  if (session) {
    return <>{children}</>;
  }

  // 5. 如果会话不存在，不渲染任何内容，等待 useEffect 重定向
  return null;
}
