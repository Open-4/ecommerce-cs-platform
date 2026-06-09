"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  ShoppingBag,
  Settings,
  LogOut,
  Rocket,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/conversations", label: "会话管理", icon: MessageSquare },
  { href: "/knowledge", label: "知识库", icon: BookOpen },
  { href: "/orders", label: "订单退款", icon: ShoppingBag },
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/onboarding", label: "入驻向导", icon: Rocket },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-bold text-slate-900">ECS 中台</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}

/** 试用状态横幅 */
function TrialBanner() {
  // 模拟试用数据（实际从 API 获取）
  const trialDaysLeft = 12;
  const trialUsed = 23;
  const trialLimit = 100;
  const isTrial = true;

  if (!isTrial) return null;

  const isLow = trialDaysLeft <= 3;
  const usagePercent = Math.round((trialUsed / trialLimit) * 100);

  return (
    <div
      className={`flex items-center justify-between px-6 py-2 text-sm ${
        isLow
          ? "bg-orange-50 border-b border-orange-200 text-orange-800"
          : "bg-blue-50 border-b border-blue-200 text-blue-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {isLow ? (
            <span className="font-medium">
              试用仅剩 {trialDaysLeft} 天，即将到期！
            </span>
          ) : (
            <span>
              免费试用中 · 剩余 <strong>{trialDaysLeft}</strong> 天
            </span>
          )}
        </span>
        <span className="text-slate-400">|</span>
        <span>
          已使用 <strong>{trialUsed}</strong> / {trialLimit} 次 AI 会话
          <span className="ml-2 inline-block h-1.5 w-24 rounded-full bg-blue-200">
            <span
              className="block h-1.5 rounded-full bg-blue-500"
              style={{ width: `${usagePercent}%` }}
            />
          </span>
        </span>
      </div>
      <a
        href="/pricing"
        className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
      >
        升级套餐
        <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  );
}
