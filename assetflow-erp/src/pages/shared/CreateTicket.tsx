import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTicketStore } from "@/stores/ticketStore"
import { useAssetStore } from "@/stores/assetStore"
import { useAuthStore } from "@/stores/authStore"
import { getErrorMessage } from "@/lib/errors"

export function CreateTicket() {
  const navigate = useNavigate()
  const { addTicket } = useTicketStore()
  const { assets } = useAssetStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin" || user?.role === "super-admin"

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "issue" as const,
    priority: "medium" as const,
    assetId: "",
    assetName: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId)
    setForm((f) => ({ ...f, assetId, assetName: asset?.name || "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required")
      return
    }
    setLoading(true)
    setError("")
    try {
      await addTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        priority: form.priority,
        status: "open",
        assetId: form.assetId || undefined,
        assetName: form.assetName || undefined,
        createdBy: user!.id,
        createdByName: user!.name,
        source: "manual",
      })
      navigate(isAdmin ? "/tickets" : "/member/tickets")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create ticket"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">New Ticket</h1>
          <p className="text-muted-foreground text-sm">Submit a support request or report an issue</p>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle>Ticket Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Brief description of the issue" value={form.title}
                onChange={(e) => set("title", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Provide full details about the issue..." rows={4}
                value={form.description} onChange={(e) => set("description", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue">Issue / Bug</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Related Asset (optional)</Label>
              <Select value={form.assetId} onValueChange={handleAssetChange}>
                <SelectTrigger><SelectValue placeholder="Select an asset (optional)" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} — {a.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
