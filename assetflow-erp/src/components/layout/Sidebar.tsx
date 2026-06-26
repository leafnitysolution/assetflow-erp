import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  QrCode,
  Ticket,
  Truck,
  FileText,
  Settings,
  Shield,
  LogOut,
  ScanLine,
  UserCircle,
  ChevronLeft,
  MailOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { useTicketStore } from "@/stores/ticketStore"
import type { UserRole } from "@/types"
import { Logo } from "./Logo"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  // Super Admin
  { label: "Dashboard", path: "/super-admin/dashboard", icon: Shield, roles: ["super-admin"] },
  { label: "Admins", path: "/super-admin/admins", icon: Users, roles: ["super-admin"] },
  { label: "System Logs", path: "/super-admin/logs", icon: FileText, roles: ["super-admin"] },
  
  // Admin
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Members", path: "/admin/members", icon: Users, roles: ["admin"] },
  { label: "Inventory", path: "/inventory", icon: Package, roles: ["admin", "super-admin"] },
  { label: "Allocations", path: "/allocations", icon: UserCircle, roles: ["admin", "super-admin"] },
  { label: "QR Generator", path: "/qr-generator", icon: QrCode, roles: ["admin", "super-admin"] },
  { label: "Tickets", path: "/tickets", icon: Ticket, roles: ["admin", "super-admin"] },
  { label: "Email → Ticket", path: "/email-ticket", icon: MailOpen, roles: ["admin", "super-admin"] },
  { label: "Vendors", path: "/vendors", icon: Truck, roles: ["admin", "super-admin"] },
  { label: "Reports", path: "/reports", icon: FileText, roles: ["admin", "super-admin"] },
  
  // Member
  { label: "My Dashboard", path: "/member/dashboard", icon: LayoutDashboard, roles: ["member"] },
  { label: "My Assets", path: "/member/assets", icon: Package, roles: ["member"] },
  { label: "My Tickets", path: "/member/tickets", icon: Ticket, roles: ["member"] },
  
  // Shared
  { label: "QR Scanner", path: "/scanner", icon: ScanLine, roles: ["admin", "super-admin", "member"] },
  { label: "Settings", path: "/settings", icon: Settings, roles: ["admin", "super-admin", "member"] },
]

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { tickets } = useTicketStore()
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in-progress").length

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "member")
  )

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-secondary border-r border-border transition-all duration-300 flex flex-col",
        "w-64 -translate-x-full md:translate-x-0 md:flex",
        mobileOpen && "translate-x-0",
        collapsed ? "md:w-20" : "md:w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {(!collapsed || mobileOpen) && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Logo className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-white">
              AssetFlow
            </span>
          </div>
        )}
        {collapsed && !mobileOpen && (
          <div className="mx-auto h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Logo className="h-6 w-6 text-white" />
          </div>
        )}
        
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseMobile}
          className="text-white hover:bg-white/10 md:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "text-white hover:bg-white/10 hidden md:inline-flex",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
                collapsed && "md:justify-center md:px-2",
                mobileOpen && "justify-start px-3"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", (collapsed && !mobileOpen) && "md:h-6 md:w-6")} />
              {(!collapsed || mobileOpen) && <span className="flex-1">{item.label}</span>}
              {(!collapsed || mobileOpen) && (item.path === "/tickets" || item.path === "/member/tickets") && openTickets > 0 && (
                <span className="ml-auto bg-danger text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {openTickets}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-white",
            (collapsed && !mobileOpen) && "md:justify-center md:px-2",
            mobileOpen && "justify-start px-3"
          )}
          onClick={() => {
            handleLogout()
            if (onCloseMobile) onCloseMobile()
          }}
        >
          <LogOut className="h-5 w-5" />
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}
