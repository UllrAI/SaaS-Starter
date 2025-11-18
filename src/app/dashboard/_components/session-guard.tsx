"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

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
    return <SessionGuardLoading />;
  }

  // 4. 会话有效，渲染子组件
  if (session) {
    return <>{children}</>;
  }

  // 5. 如果会话不存在，不渲染任何内容，等待 useEffect 重定向
  return null;
}

function SessionGuardLoading() {
  return (
    <section className="absolute inset-0 flex items-center justify-center bg-background/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="bg-primary/10 absolute inset-0 animate-pulse rounded-full" />
          <div className="border-border bg-background/50 relative flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-sm">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sparkles className="text-primary h-3 w-3 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    </section>
  );
}
