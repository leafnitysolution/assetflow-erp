import { useCallback, useEffect, useState } from "react"
import {
  UserCheck, RotateCcw, Wrench, Plus, PlusCircle, Loader2, DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { formatDate, formatCurrency } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

interface HistoryEntry {
  id: string
  event: "ASSIGNED" | "RETURNED" | "REPAIR" | "STATUS_CHANGE" | "CREATED"
  userName?: string
  userEmail?: string
  performedBy?: string
  fromStatus?: string
  toStatus?: string
  repairDetails?: { description: string; cost: number; vendor?: string; date: string }
  notes?: string
  createdAt: string
}

interface Props {
  assetId: string
  assetName?: string
  showRepairButton?: boolean
}

export function AssetHistoryPanel({ assetId, showRepairButton = false }: Props) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin" || user?.role === "super-admin"
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [totalRepairCost, setTotalRepairCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [repairOpen, setRepairOpen] = useState(false)
  const [repairForm, setRepairForm] = useState({ description: "", cost: "", vendor: "", notes: "" })
  const [submitting, setSubmitting] = useState(false)
  const [repairError, setRepairError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data } = await api.get(`/asset-history/${assetId}`)
      setHistory(data.history || [])
      setTotalRepairCost(data.totalRepairCost || 0)
    } catch {
      setError("Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => { load() }, [load])

  const handleLogRepair = async () => {
    if (!repairForm.description.trim()) { setRepairError("Description is required"); return }
    setSubmitting(true)
    setRepairError("")
    try {
      await api.post(`/asset-history/${assetId}/repair`, {
        description: repairForm.description.trim(),
        cost: parseFloat(repairForm.cost) || 0,
        vendor: repairForm.vendor.trim() || undefined,
        notes: repairForm.notes.trim() || undefined,
      })
      setRepairForm({ description: "", cost: "", vendor: "", notes: "" })
      setRepairOpen(false)
      load()
    } catch (err: unknown) {
      setRepairError(getErrorMessage(err, "Failed to log repair"))
    } finally {
      setSubmitting(false)
    }
  }

  const eventIcon = (event: HistoryEntry["event"]) => {
    if (event === "ASSIGNED")   return <UserCheck  className="h-4 w-4 text-primary" />
    if (event === "RETURNED")   return <RotateCcw  className="h-4 w-4 text-accent" />
    if (event === "REPAIR")     return <Wrench     className="h-4 w-4 text-warning" />
    if (event === "CREATED")    return <Plus       className="h-4 w-4 text-accent" />
    return <Plus className="h-4 w-4 text-muted-foreground" />
  }

  const eventColor = (event: HistoryEntry["event"]) => {
    if (event === "ASSIGNED")   return "bg-primary/10 border-primary/30"
    if (event === "RETURNED")   return "bg-accent/10 border-accent/30"
    if (event === "REPAIR")     return "bg-warning/10 border-warning/30"
    return "bg-muted border-border"
  }

  const eventLabel = (entry: HistoryEntry) => {
    if (entry.event === "ASSIGNED") return `Assigned to ${entry.userName || "user"}`
    if (entry.event === "RETURNED") return "Returned to inventory"
    if (entry.event === "REPAIR")   return `Repair: ${entry.repairDetails?.description}`
    if (entry.event === "CREATED")  return "Asset created"
    return entry.event
  }

  const assignedCount = history.filter((h) => h.event === "ASSIGNED").length
  const repairCount   = history.filter((h) => h.event === "REPAIR").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-primary">{assignedCount}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Times Assigned</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-warning">{repairCount}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Repairs</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold">{formatCurrency(totalRepairCost)}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Repair Cost</p>
        </div>
      </div>

      {/* Log Repair button */}
      {isAdmin && showRepairButton && (
        <Dialog open={repairOpen} onOpenChange={setRepairOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Log Repair / Cost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Repair</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {repairError && <Alert variant="destructive"><AlertDescription>{repairError}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea placeholder="What was repaired / replaced?" value={repairForm.description}
                  onChange={(e) => setRepairForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cost (₹)</Label>
                  <Input type="number" placeholder="0" value={repairForm.cost}
                    onChange={(e) => setRepairForm((f) => ({ ...f, cost: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Vendor / Service</Label>
                  <Input placeholder="Vendor name" value={repairForm.vendor}
                    onChange={(e) => setRepairForm((f) => ({ ...f, vendor: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any additional notes" value={repairForm.notes}
                  onChange={(e) => setRepairForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRepairOpen(false)}>Cancel</Button>
                <Button onClick={handleLogRepair} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Separator />

      {/* Timeline */}
      {history.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">No history recorded yet</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="relative flex gap-4 pl-10">
                <div className={`absolute left-1 top-1 h-6 w-6 rounded-full border flex items-center justify-center ${eventColor(entry.event)}`}>
                  {eventIcon(entry.event)}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{eventLabel(entry)}</p>
                      {entry.event === "ASSIGNED" && entry.userEmail && (
                        <p className="text-xs text-muted-foreground">{entry.userEmail}</p>
                      )}
                      {entry.event === "REPAIR" && entry.repairDetails && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.repairDetails.vendor && (
                            <span className="text-xs text-muted-foreground">by {entry.repairDetails.vendor}</span>
                          )}
                          {entry.repairDetails.cost > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {formatCurrency(entry.repairDetails.cost)}
                            </Badge>
                          )}
                        </div>
                      )}
                      {entry.performedBy && (
                        <p className="text-xs text-muted-foreground">by {entry.performedBy}</p>
                      )}
                      {entry.notes && <p className="text-xs text-muted-foreground italic">{entry.notes}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(entry.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
