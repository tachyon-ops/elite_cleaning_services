import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Shield, BookOpen, Users, LogOut, LayoutDashboard, Sliders, KeyRound, RefreshCw } from "lucide-react";
import { getLoggedInAdmin } from "@/app/actions/admin";
import { getTranslationsForLocale, translate } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_session")?.value === "true";
  const admin = await getLoggedInAdmin();
  const isSuperAdmin = admin?.role === "super_admin";

  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] flex font-body">
      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="w-[280px] bg-[#141414] border-r border-[#262626] flex flex-col p-6 space-y-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#262626]">
            <div className="h-10 w-10 bg-accent-soft text-accent rounded-full flex items-center justify-center border border-accent/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-medium text-body-md block tracking-tight">{t("admin.sidebar.title")}</span>
              <span className="text-caption text-ink-subtle uppercase">{t("admin.sidebar.subtitle")}</span>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
             <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> {t("admin.sidebar.dashboard")}
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <BookOpen className="w-4 h-4" /> {t("admin.sidebar.bookings")}
            </Link>
            <Link
              href="/admin/recurring"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t("admin.sidebar.recurring")}
            </Link>
            <Link
              href="/admin/provider-applications"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <Users className="w-4 h-4" /> {t("admin.sidebar.applications")}
            </Link>
            <Link
              href="/admin/providers"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <Shield className="w-4 h-4" /> {t("admin.sidebar.providers")}
            </Link>
            {isSuperAdmin && (
              <Link
                href="/admin/verticals"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
              >
                <Sliders className="w-4 h-4" /> {t("admin.sidebar.verticals")}
              </Link>
            )}
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <KeyRound className="w-4 h-4" /> {t("admin.sidebar.settings")}
            </Link>
          </nav>

          <div className="flex flex-col gap-4 pt-6 border-t border-[#262626]">
            <div className="px-4 flex items-center justify-between">
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Language</span>
              <LanguageSwitcher />
            </div>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-left"
              >
                <LogOut className="w-4 h-4" /> {t("admin.sidebar.logout")}
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#080808]">
        {children}
      </div>
    </div>
  );
}
