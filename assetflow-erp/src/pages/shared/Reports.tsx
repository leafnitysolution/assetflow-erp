import { useState } from "react"
import { Download, BarChart3, PieChart, TrendingUp, Calendar, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"
import { getBranchOptions, normalizeBranch } from "@/lib/branches"

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Reports() {
  const { assets } = useAssetStore()
  const { tickets } = useTicketStore()
  const { users } = useUserStore()
  const [dateRange, setDateRange] = useState("30")
  const [branchFilter, setBranchFilter] = useState("all")
  const branchOptions = getBranchOptions([...assets.map((asset) => asset.branch), ...users.map((user) => user.branch)])
  const filteredAssets = branchFilter === "all"
    ? assets
    : assets.filter((asset) => normalizeBranch(asset.branch) === branchFilter)
  const filteredAssetIds = new Set(filteredAssets.map((asset) => asset.id))
  const filteredTickets = branchFilter === "all"
    ? tickets
    : tickets.filter((ticket) => {
        if (ticket.assetId) return filteredAssetIds.has(ticket.assetId)
        const createdBy = users.find((user) => user.id === ticket.createdBy)
        return normalizeBranch(createdBy?.branch) === branchFilter
      })

  const handleExport = () => {
    const rows = [
      ["Name", "Category", "Status", "Condition", "Branch", "Location", "Purchase Price", "Current Value", "Serial Number", "Assigned To"],
      ...filteredAssets.map((a) => [a.name, a.category, a.status, a.condition, normalizeBranch(a.branch), a.location || "", String(a.purchasePrice || ""), String(a.currentValue || ""), a.serialNumber || "", a.assignedTo || ""])
    ]
    exportCSV(`assetflow-report-${new Date().toISOString().slice(0,10)}.csv`, rows)
  }

  // Asset status distribution
  const assetStatusData = [
    { name: "Available", value: filteredAssets.filter((a) => a.status === "available").length },
    { name: "Assigned", value: filteredAssets.filter((a) => a.status === "assigned").length },
    { name: "Maintenance", value: filteredAssets.filter((a) => a.status === "maintenance").length },
    { name: "Retired", value: filteredAssets.filter((a) => a.status === "retired").length },
  ].filter((d) => d.value > 0)

  // Asset category distribution
  const assetCategoryData = [
    { name: "Electronics", count: filteredAssets.filter((a) => a.category === "electronics").length },
    { name: "Furniture", count: filteredAssets.filter((a) => a.category === "furniture").length },
    { name: "Vehicles", count: filteredAssets.filter((a) => a.category === "vehicle").length },
    { name: "Equipment", count: filteredAssets.filter((a) => a.category === "equipment").length },
    { name: "Tools", count: filteredAssets.filter((a) => a.category === "tools").length },
  ].filter((d) => d.count > 0)

  // Tickets by status
  const ticketStatusData = [
    { name: "Open", count: filteredTickets.filter((t) => t.status === "open").length },
    { name: "In Progress", count: filteredTickets.filter((t) => t.status === "in-progress").length },
    { name: "Resolved", count: filteredTickets.filter((t) => t.status === "resolved").length },
    { name: "Closed", count: filteredTickets.filter((t) => t.status === "closed").length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View insights and generate reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets">
            <BarChart3 className="mr-2 h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <PieChart className="mr-2 h-4 w-4" />
            Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={assetStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          {/* KPI row */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Assets", value: filteredAssets.length, color: "text-primary" },
              { label: "Available", value: filteredAssets.filter((a) => a.status === "available").length, color: "text-accent" },
              { label: "Assigned", value: filteredAssets.filter((a) => a.status === "assigned").length, color: "text-blue-500" },
              { label: "In Maintenance", value: filteredAssets.filter((a) => a.status === "maintenance").length, color: "text-warning" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-6">
                  <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Asset Value by Category</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" name="Assets" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Asset Status Breakdown</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={assetStatusData} cx="50%" cy="50%" outerRadius={90}
                      label={({ name, percent }) => `${name} ${percent ? (percent*100).toFixed(0) : 0}%`}
                      labelLine={false} dataKey="value">
                      {assetStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Asset Inventory Table</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {filteredAssets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium">{a.name}</span>
                      <span className="text-muted-foreground ml-2 capitalize">({a.category})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{normalizeBranch(a.branch)}</span>
                      <span className="text-muted-foreground">{a.location || "—"}</span>
                      <span className={`capitalize font-medium ${
                        a.status === "available" ? "text-accent" :
                        a.status === "assigned" ? "text-primary" :
                        a.status === "maintenance" ? "text-warning" : "text-destructive"
                      }`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Statistics</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
