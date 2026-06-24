import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Package, History, Activity, User, Mail, Building2,
  Calendar, Clock, CheckCircle2, Loader2, UserCheck, RotateCcw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserStore } from "@/stores/userStore"
import { useAssetStore } from "@/stores/assetStore"
import { api } from "@/lib/api"
import { formatDate, formatCurrency } from "@/lib/utils"

interface HistoryEntry {
  id: string
  event: string
  assetId: string
  assetName?: string
  performedBy?: string
  createdAt: string
}

interface LogEntry {
  id: string
  action: string
  entityType: string
  entityName?: string
  details?: string
  ipAddress?: string
  createdAt: string
}

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { users } = useUserStore()
  const { assets } = useAssetStore()

  const member = users.find((u) => u.id === id)
  const currentAssets = assets.filter((a) => a.assignedTo === id)

  const [assetHistory, setAssetHistory] = useState<HistoryEntry[]>([])
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get(`/asset-history/user/${id}`),
      api.get(`/logs`, { params: { userId: id, limit: 100 } }),
    ])
      .then(([histRes, logRes]) => {
        setAssetHistory(histRes.data || [])
        setActivityLogs(logRes.data || [])
      })
      .catch(() => setError("Failed to load member data"))
      .finally(() => setLoading(false))
  }, [id])

  if (!member) {
    return (
      <div className="text-center py-16">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Member not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const initials = member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
  const totalAllocations = assetHistory.filter((h) => h.event === "ASSIGNED").length
  const totalReturns     = assetHistory.filter((h) => h.event === "RETURNED").length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-heading text-2xl font-bold">Member Profile</h1>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-white text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{member.name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
              </div>
              <Badge variant={member.status === "active" ? "accent" : "secondary"}>
                {member.status}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.department && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{member.department}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Joined {formatDate(member.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Last login: {member.lastLogin ? formatDate(member.lastLogin) : "Never"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Stats + Tabs */}
        <div className="col-span-2 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-primary">{currentAssets.length}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Current Assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold">{totalAllocations}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Total Assigned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-accent">{totalReturns}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Total Returned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-warning">{activityLogs.length}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Activity Logs</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="assets">
            <TabsList>
              <TabsTrigger value="assets">
                <Package className="mr-2 h-4 w-4" />
                Current Assets ({currentAssets.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Asset History ({totalAllocations})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-4 w-4" />
                Activity ({activityLogs.length})
              </TabsTrigger>
            </TabsList>

            {/* Current Assets */}
            <TabsContent value="assets">
              <Card>
                <CardContent className="pt-4">
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : currentAssets.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No assets currently assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{asset.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {asset.category} · {asset.condition}
                                {asset.serialNumber && ` · SN: ${asset.serialNumber}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="text-xs">{asset.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Since {formatDate(asset.assignedAt || "")}
                            </p>
                            <p className="text-xs font-medium">
                              {formatCurrency(asset.currentValue || asset.purchasePrice || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 text-sm text-muted-foreground text-right">
                        Total value: <strong>{formatCurrency(currentAssets.reduce((s, a) => s + (a.currentValue || a.purchasePrice || 0), 0))}</strong>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Asset History */}
            <TabsContent value="history">
              <Card>
                <CardContent className="pt-4">
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : assetHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No asset history yet</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-4">
                        {assetHistory.map((entry) => (
                          <div key={entry.id} className="relative flex gap-4 pl-10">
                            <div className={`absolute left-1 top-1 h-6 w-6 rounded-full border flex items-center justify-center
                              ${entry.event === "ASSIGNED" ? "bg-primary/10 border-primary/30" : "bg-accent/10 border-accent/30"}`}>
                              {entry.event === "ASSIGNED"
                                ? <UserCheck className="h-3.5 w-3.5 text-primary" />
                                : <RotateCcw className="h-3.5 w-3.5 text-accent" />}
                            </div>
                            <div className="flex-1 flex items-start justify-between gap-2 pb-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {entry.event === "ASSIGNED" ? "Asset Assigned" : "Asset Returned"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.assetName || entry.assetId}
                                  {entry.performedBy && ` · by ${entry.performedBy}`}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(entry.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Log */}
            <TabsContent value="activity">
              <Card>
                <CardContent className="pt-4">
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-10">
                      <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No activity recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0
                              ${log.action === "LOGIN" ? "bg-accent/10" : log.action === "DELETE" ? "bg-destructive/10" : "bg-primary/10"}`}>
                              <CheckCircle2 className={`h-3.5 w-3.5
                                ${log.action === "LOGIN" ? "text-accent" : log.action === "DELETE" ? "text-destructive" : "text-primary"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                <span className="text-xs text-muted-foreground capitalize">{log.entityType}</span>
                                {log.entityName && <span className="text-xs text-muted-foreground">· {log.entityName}</span>}
                              </div>
                              {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                              {log.ipAddress && <p className="text-xs font-mono text-muted-foreground">{log.ipAddress}</p>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
