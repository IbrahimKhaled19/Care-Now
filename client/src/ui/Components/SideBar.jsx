import { useState, useEffect, lazy, Suspense } from "react";
import { NavLink } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

const NotificationInbox = lazy(() => import("../../components/NotificationInbox"));

import {
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
  Users,
  CreditCard,
  FileText,
  Shield,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  { id: "requests", label: "Requests", icon: ClipboardList, path: "/requests" },
  {
    id: "providers",
    label: "Providers",
    icon: Stethoscope,
    path: "/providers",
  },
  { id: "patients", label: "Patients", icon: Users, path: "/patients" },
  { id: "billing", label: "Billing", icon: CreditCard, path: "/billing" },
  { id: "reports", label: "Reports", icon: FileText, path: "/report" },
  { id: "admins", label: "Admins", icon: Shield, path: "/admins" },
];

function SideBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inboxKey, setInboxKey] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 right-4 left-auto z-50 p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-teal-700 md:hidden cursor-pointer"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 transition-all duration-200 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 py-5 border-b border-gray-100`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-bold text-gray-800">
                  Care Now
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors duration-100 hidden md:block cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                size={18}
                className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Main navigation"
            className="flex-1 px-3 py-4 overflow-y-auto"
          >
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? "bg-teal-50 text-teal-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        } ${collapsed ? "justify-center" : ""}`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-gray-100">
            {/* Notifications */}
            <div className={collapsed ? "flex justify-center mb-2" : "px-3 py-2 mb-2"}>
              <Suspense fallback={null}>
                <NotificationInbox
                  key={inboxKey}
                  onNavigate={() => { setMobileOpen(false); setInboxKey((k) => k + 1); }}
                />
              </Suspense>
            </div>

            {/* User Profile */}
            {!collapsed && user && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.fullName || user.firstName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            )}

            {collapsed && (
              <div className="flex justify-center mb-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default SideBar;
