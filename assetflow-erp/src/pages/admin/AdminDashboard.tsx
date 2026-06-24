import { useMemo, useState } from "react"
import {
  Package,
  Users,
  Ticket,
  QrCode,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"
import { Link } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBranchOptions, normalizeBranch } from "@/lib/branches"

export function AdminDashboard() {
  const { assets } = useAssetStore()
  const { tickets } = useTicketStore()
  const { users } = useUserStore()
  const [branchFilter, setBranchFilter] = useState("all")
  const branchOptions = getBranchOptions([...assets.map((asset) => asset.branch), ...users.map((user) => user.branch)])

  const stats = useMemo(() => {
    const filteredAssets = branchFilter === "all"
      ? assets
      : assets.filter((asset) => normalizeBranch(asset.branch) === branchFilter)
    const branchAssetIds = new Set(filteredAssets.map((asset) => asset.id))
    const filteredTickets = branchFilter === "all"
      ? tickets
      : tickets.filter((ticket) => {
          if (ticket.assetId) return branchAssetIds.has(ticket.assetId)
          const createdBy = users.find((user) => user.id === ticket.createdBy)
          return normalizeBranch(createdBy?.branch) === branchFilter
        })
    const availableAssets = filteredAssets.filter((a) => a.status === "available")
    const assignedAssets = filteredAssets.filter((a) => a.status === "assigned")
    const maintenanceAssets = filteredAssets.filter((a) => a.status === "maintenance")
    const openTickets = filteredTickets.filter((t) => t.status === "open")
    const urgentTickets = filteredTickets.filter((t) => t.priority === "urgent")
    const members = users.filter((u) => u.role === "member" && (branchFilter === "all" || normalizeBranch(u.branch) === branchFilter))

    return {
      filteredTickets,
      totalAssets: filteredAssets.length,
      availableAssets: availableAssets.length,
      assignedAssets: assignedAssets.length,
      maintenanceAssets: maintenanceAssets.length,
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      urgentTickets: urgentTickets.length,
      totalMembers: members.length,
    }
  }, [assets, branchFilter, tickets, users])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization's assets and operations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[200px]">
              <Building2 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branchOptions.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link to="/qr-generator">
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR
            </Link>
          </Button>
          <Button asChild>
            <Link to="/inventory">
              <Package className="mr-2 h-4 w-4" />
              Add Asset
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-accent flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {stats.availableAssets}
              </span>
              <span className="ml-2">available</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Assets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-primary flex items-center">
                {stats.totalMembers}
              </span>
              <span className="ml-2">members</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-danger flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {stats.urgentTickets}
              </span>
              <span className="ml-2">urgent</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="text-warning flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                Pending
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/members">
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/inventory">
                <Package className="mr-2 h-4 w-4" />
                View Inventory
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/allocations">
                <TrendingUp className="mr-2 h-4 w-4" />
                Asset Allocations
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                View Tickets
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support requests</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tickets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.filteredTickets.slice(0, 4).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {ticket.createdByName}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    ticket.priority === "urgent"
                      ? "destructive"
                      : ticket.priority === "high"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {ticket.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
