import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Shield, BookOpen, Users, LogOut, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_session")?.value === "true";

  // Check path name via header or check simple status
  // Note: Since this is a server layout, if not authenticated we let pages handle redirect or check here.
  // We can let layout gate all children except login.

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
              <span className="font-display font-medium text-body-md block tracking-tight">ELITE CONTROL</span>
              <span className="text-caption text-ink-subtle uppercase">Backoffice Ops</span>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <BookOpen className="w-4 h-4" /> Bookings & Dispatch
            </Link>
            <Link
              href="/admin/partners"
              className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <Users className="w-4 h-4" /> Partners
            </Link>
          </nav>

          <div className="pt-6 border-t border-[#262626]">
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-left"
              >
                <LogOut className="w-4 h-4" /> Log Out
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
