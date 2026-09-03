import React from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getLoggedInAdmin } from "@/app/actions/admin";
import { getTranslationsForLocale, translate } from "@/lib/i18n";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/signup";

  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_session")?.value === "true";

  if (isAuthPage) {
    if (isAuthenticated) {
      redirect("/admin");
    }
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  const admin = await getLoggedInAdmin();
  const isSuperAdmin = admin?.role === "super_admin";

  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] flex font-body">
      {/* Collapsible Sidebar */}
      {isAuthenticated && (
        <AdminSidebar
          isSuperAdmin={isSuperAdmin}
          translations={{
            title: t("admin.sidebar.title") || "Admin Portal",
            subtitle: t("admin.sidebar.subtitle") || "Management",
            dashboard: t("admin.sidebar.dashboard") || "Dashboard",
            bookings: t("admin.sidebar.bookings") || "Bookings",
            recurring: t("admin.sidebar.recurring") || "Recurring",
            applications: t("admin.sidebar.applications") || "Applications",
            providers: t("admin.sidebar.providers") || "Providers",
            verticals: t("admin.sidebar.verticals") || "Verticals",
            marketing: t("admin.sidebar.marketing") || "Marketing",
            mining: t("admin.sidebar.mining") || "Lead Mining",
            sales: t("admin.sidebar.sales") || "Sales",
            settings: t("admin.sidebar.settings") || "Settings",
            logout: t("admin.sidebar.logout") || "Logout",
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#080808] min-w-0">
        {children}
      </div>
    </div>
  );
}
