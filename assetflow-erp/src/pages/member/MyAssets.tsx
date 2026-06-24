import { useMemo, useState, useEffect } from "react"
import { Package, QrCode, Calendar, MapPin, Tag, Info, History, RotateCcw, UserCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from "@/stores/authStore"
import { useAssetStore } from "@/stores/assetStore"
import { api } from "@/lib/api"
import { formatDate, formatCurrency } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import { AssetHistoryPanel } from "@/components/AssetHistoryPanel"

interface HistoryEntry {
  id: string
  event: string
  assetId: string
  assetName?: string
  userName?: string
  createdAt: string
}

export function MyAssets() {
  const { user } = useAuthStore()
  const { assets } = useAssetStore()
  const [myHistory, setMyHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const myAssets = useMemo(
    () => assets.filter((a) => a.assignedTo === user?.id),
    [assets, user]
  )

  useEffect(() => {
    if (!user?.id) return
    setHistoryLoading(true)
    api.get(`/asset-history/user/${user.id}`)
      .then(({ data }) => setMyHistory(data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [user?.id])

  const getConditionVariant = (c: string) => {
    if (c === "excellent") return "accent"
    if (c === "good") return "default"
    if (c === "fair") return "warning"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">Assets assigned to you</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/scanner">
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR
          </Link>
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{myAssets.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent">
              {myAssets.filter((a) => a.condition === "excellent" || a.condition === "good").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">In Good Condition</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-foreground">
              {myHistory.filter((h) => h.event === "ASSIGNED").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Allocations (ever)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Assets ({myAssets.length})</TabsTrigger>
          <TabsTrigger value="history">
            My History ({myHistory.filter((h) => h.event === "ASSIGNED").length})
          </TabsTrigger>
        </TabsList>

        {/* ── Current Assets tab ── */}
        <TabsContent value="current">
          {myAssets.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-1">No assets assigned</h3>
                <p className="text-muted-foreground text-sm">
                  Contact your admin to get assets assigned to you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {myAssets.map((asset) => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base leading-tight">{asset.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{asset.category}</p>
                      </div>
                      <Badge variant={getConditionVariant(asset.condition)} className="capitalize text-xs flex-shrink-0">
                        {asset.condition}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-center p-3 bg-white rounded-lg border">
                      <QRCodeSVG value={asset.qrCode || `asset:${asset.id}`} size={100} level="L" />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {asset.serialNumber && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>SN: {asset.serialNumber}</span>
                        </div>
                      )}
                      {asset.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{asset.location}</span>
                        </div>
                      )}
                      {asset.assignedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Since {formatDate(asset.assignedAt)}</span>
                        </div>
                      )}
                      {asset.warrantyExpiry && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Info className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Warranty: {formatDate(asset.warrantyExpiry)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-1 text-xs text-muted-foreground font-medium">
                      Value: {formatCurrency(asset.currentValue || asset.purchasePrice || 0)}
                    </div>
                    {/* View History per asset */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <History className="mr-2 h-3.5 w-3.5" />
                          View Asset History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{asset.name} — History</DialogTitle>
                        </DialogHeader>
                        <AssetHistoryPanel assetId={asset.id} assetName={asset.name} />
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── My History tab ── */}
        <TabsContent value="history">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Asset Allocation History</CardTitle>
              <p className="text-sm text-muted-foreground">All assets that were ever assigned to or returned by you</p>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
              ) : myHistory.length === 0 ? (
                <div className="text-center py-10">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No allocation history yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {myHistory.map((entry) => (
                      <div key={entry.id} className="relative flex gap-4 pl-10">
                        <div className={`absolute left-1 top-1 h-6 w-6 rounded-full border flex items-center justify-center
                          ${entry.event === "ASSIGNED" ? "bg-primary/10 border-primary/30" : "bg-accent/10 border-accent/30"}`}>
                          {entry.event === "ASSIGNED"
                            ? <UserCheck className="h-3.5 w-3.5 text-primary" />
                            : <RotateCcw className="h-3.5 w-3.5 text-accent" />}
                        </div>
                        <div className="flex-1 pb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {entry.event === "ASSIGNED" ? "Assigned: " : "Returned: "}
                              <span className="text-foreground">{entry.assetName || entry.assetId}</span>
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
