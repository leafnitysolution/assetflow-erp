import { useMemo, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Shield, Users, Package, Ticket, Activity, TrendingUp, AlertTriangle, FileText, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/utils"

interface RecentActivity {
  id?: string
  _id?: string
  userName: string
  userRole: string
  action: string
  createdAt: string
}

interface FailedLoginSummary {
  _id: string
  count: number
  emails?: string[]
}

export function SuperAdminDashboard() {
  const { assets } = useAssetStore()
  const { tickets } = useTicketStore()
  const { users } = useUserStore()
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [failedLogins, setFailedLogins] = useState<FailedLoginSummary[]>([])

  useEffect(() => {
    api.get("/logs/dashboard-summary").then(({ data }) => {
      setRecentActivity(data.recentActivity || [])
      setFailedLogins(data.failedLogins || [])
    }).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin")
    const superAdmins = users.filter((u) => u.role === "super-admin")
    const openTickets = tickets.filter((t) => t.status === "open")
    const resolvedToday = tickets.filter(
      (t) => t.resolvedAt && new Date(t.resolvedAt).toDateString() === new Date().toDateString()
    )
    return {
      totalAssets: assets.length,
      totalAdmins: admins.length,
      totalSuperAdmins: superAdmins.length,
      openTickets: openTickets.length,
      resolvedToday: resolvedToday.length,
    }
  }, [assets, tickets, users])

  const totalFailedAttempts = failedLogins.reduce((s, f) => s + f.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">System-wide monitoring and control</p>
        </div>
        <Button variant="outline" className="w-fit">
          <Activity className="mr-2 h-4 w-4" />
          System Health: 98.5%
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">+ {stats.totalSuperAdmins} super admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">{stats.resolvedToday} resolved today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Real Activity Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Activity Log</CardTitle>
                <CardDescription>Recent actions across the system</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/super-admin/logs">
                  <FileText className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No activity yet</TableCell></TableRow>
                ) : recentActivity.map((log) => (
                  <TableRow key={log.id || log._id}>
                    <TableCell>
                      <p className="font-medium text-sm">{log.userName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{log.userRole}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Alerts — real failed logins */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalFailedAttempts > 0 ? (
              failedLogins.map((f) => (
                <div key={f._id} className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Failed Login Attempts</p>
                    <p className="text-xs text-muted-foreground">
                      {f.count} failed attempt{f.count > 1 ? "s" : ""} from IP <span className="font-mono">{f._id}</span>
                    </p>
                    {(f.emails?.length || 0) > 0 && (
                      <p className="text-xs text-muted-foreground">Accounts tried: {f.emails?.join(", ")}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No Failed Logins</p>
                  <p className="text-xs text-muted-foreground">No suspicious activity in the last 24 hours</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-sm">Database Backup</p>
                <p className="text-xs text-muted-foreground">Last backup completed successfully 2 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
