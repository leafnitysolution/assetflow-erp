import { useState, useEffect, useCallback } from "react"
import { Search, Download, Filter, FileText, User, Package, Ticket, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "accent" | "destructive" | "warning" | "outline"

interface Log {
  id: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  details?: string
  ipAddress?: string
  createdAt: string
}

export function Logs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params: Record<string, string> = {}
      if (actionFilter !== "all") params.action = actionFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()
      const { data } = await api.get("/logs", { params })
      setLogs(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load logs"))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, searchQuery])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const exportCSV = () => {
    const headers = ["Time", "User", "Role", "Action", "Entity Type", "Entity Name", "Details", "IP Address"]
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      l.userName,
      l.userRole,
      l.action,
      l.entityType,
      l.entityName || "",
      l.details || "",
      l.ipAddress || "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assetflow-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const getActionIcon = (entityType: string) => {
    if (entityType === "asset")  return <Package  className="h-4 w-4" />
    if (entityType === "ticket") return <Ticket   className="h-4 w-4" />
    if (entityType === "user")   return <User     className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getActionVariant = (action: string): BadgeVariant => {
    if (action === "CREATE")  return "accent"
    if (action === "DELETE")  return "destructive"
    if (action === "LOGIN")   return "secondary"
    if (action === "RESOLVE") return "accent"
    return "default"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">Audit trail and activity logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search user, action, entity..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="ASSIGN">Assign</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
                <SelectItem value="RESOLVE">Resolve</SelectItem>
                <SelectItem value="COMMENT">Comment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No logs found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{log.userName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{log.userRole}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.entityType)}
                        <div>
                          <p className="text-sm capitalize">{log.entityType}</p>
                          {log.entityName && <p className="text-xs text-muted-foreground">{log.entityName}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                      {log.details || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-3">{logs.length} entries</p>
        </CardContent>
      </Card>
    </div>
  )
}
