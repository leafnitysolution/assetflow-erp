import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "@/components/layout/Layout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { DataInitializer } from "@/components/DataInitializer"

// Auth Pages
import { Login } from "@/pages/auth/Login"
import { ForgotPassword } from "@/pages/auth/ForgotPassword"

// Super Admin Pages
import { SuperAdminDashboard } from "@/pages/super-admin/SuperAdminDashboard"
import { AdminManagement } from "@/pages/super-admin/AdminManagement"
import { Logs } from "@/pages/super-admin/Logs"

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard"
import { Members } from "@/pages/admin/Members"
import { MemberDetail } from "@/pages/admin/MemberDetail"
import { Allocations } from "@/pages/admin/Allocations"
import { EmailTicket } from "@/pages/admin/EmailTicket"

// Member Pages
import { MemberDashboard } from "@/pages/member/MemberDashboard"
import { MyAssets } from "@/pages/member/MyAssets"

// Shared Pages
import { Inventory } from "@/pages/shared/Inventory"
import { AssetDetails } from "@/pages/shared/AssetDetails"
import { Tickets } from "@/pages/shared/Tickets"
import { CreateTicket } from "@/pages/shared/CreateTicket"
import { TicketDetail } from "@/pages/shared/TicketDetail"
import { Vendors } from "@/pages/shared/Vendors"
import { Reports } from "@/pages/shared/Reports"
import { Settings } from "@/pages/shared/Settings"
import { Profile } from "@/pages/shared/Profile"
import { QRScanner } from "@/pages/shared/QRScanner"
import { QRGenerator } from "@/pages/shared/QRGenerator"

function App() {
  return (
    <BrowserRouter>
    <DataInitializer>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes with Layout */}
        <Route element={<Layout />}>
          {/* Super Admin Routes */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["super-admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/admins"
            element={
              <ProtectedRoute allowedRoles={["super-admin"]}>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/logs"
            element={
              <ProtectedRoute allowedRoles={["super-admin"]}>
                <Logs />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <MemberDetail />
              </ProtectedRoute>
            }
          />

          {/* Member Routes */}
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/assets"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MyAssets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/tickets"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/tickets/create"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <CreateTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes - All Authenticated Users */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <AssetDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocations"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <Allocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/email-ticket"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <EmailTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin", "member"]}>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/create"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <CreateTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin", "member"]}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <Vendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin", "member"]}>
                <QRScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-generator"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                <QRGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin", "member"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "super-admin", "member"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </DataInitializer>
    </BrowserRouter>
  )
}

export default App
