"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  BookOpen,
  Users,
  LogOut,
  LayoutDashboard,
  Sliders,
  KeyRound,
  RefreshCw,
  Megaphone,
  BarChart3,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  translations: {
    title: string;
    subtitle: string;
    dashboard: string;
    bookings: string;
    recurring: string;
    applications: string;
    providers: string;
    verticals: string;
    marketing: string;
    mining: string;
    sales: string;
    settings: string;
    logout: string;
    invoices?: string;
  };
}

export function AdminSidebar({ isSuperAdmin, translations: t }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") {
      setCollapsed(true);
    }
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  const navItems = [
    { href: "/admin", label: t.dashboard, icon: LayoutDashboard },
    { href: "/admin/bookings", label: t.bookings, icon: BookOpen },
    { href: "/admin/invoices", label: t.invoices || "Invoices", icon: FileText },
    { href: "/admin/recurring", label: t.recurring, icon: RefreshCw },
    { href: "/admin/provider-applications", label: t.applications, icon: Users },
    { href: "/admin/providers", label: t.providers, icon: Shield },
  ];

  const superAdminItems = [
    { href: "/admin/verticals", label: t.verticals, icon: Sliders },
    { href: "/admin/marketing", label: t.marketing || "Marketing", icon: Megaphone },
    { href: "/admin/marketing/mining", label: t.mining || "Lead Mining", icon: Building2, highlight: true },
    { href: "/admin/sales", label: t.sales || "Sales", icon: BarChart3 },
  ];

  return (
    <aside
      className={`bg-[#141414] border-r border-[#262626] flex flex-col transition-all duration-300 select-none shrink-0 ${
        collapsed ? "w-[68px] p-3" : "w-[260px] p-5"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center pb-4 border-b border-[#262626] ${collapsed ? "justify-center flex-col gap-3" : "justify-between"}`}>
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
          <div className="h-9 w-9 bg-accent-soft text-accent rounded-lg flex items-center justify-center border border-accent/25 shrink-0">
            <Shield className="w-4 h-4 text-[#d4af37]" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-display font-medium text-body-sm block tracking-tight text-white truncate">
                {t.title}
              </span>
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider block">
                {t.subtitle}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md text-[#737373] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-colors cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 flex flex-col gap-1.5 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-xs font-medium transition-all ${
                isActive
                  ? "bg-[#1f1f1f] text-[#d4af37] shadow-sm font-semibold"
                  : "text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1a1a1a]"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#d4af37]" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <div className="my-2 border-t border-[#262626]" />
            {superAdminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#1f1f1f] text-[#d4af37] shadow-sm font-semibold"
                      : "text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1a1a1a]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#d4af37]" : item.highlight ? "text-[#d4af37]" : ""
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}

        <div className="my-2 border-t border-[#262626]" />
        <Link
          href="/admin/settings"
          title={collapsed ? t.settings : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-xs font-medium transition-all ${
            pathname === "/admin/settings"
              ? "bg-[#1f1f1f] text-[#d4af37] shadow-sm font-semibold"
              : "text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1a1a1a]"
          } ${collapsed ? "justify-center px-0" : ""}`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">{t.settings}</span>}
        </Link>
      </nav>

      {/* Footer Area */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#262626]">
        {!collapsed ? (
          <div className="px-2 flex items-center justify-between">
            <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Language</span>
            <LanguageSwitcher />
          </div>
        ) : (
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        )}

        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            title={collapsed ? t.logout : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-body-xs font-medium text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${
              collapsed ? "justify-center px-0" : "text-left"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t.logout}</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
