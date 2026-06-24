import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, CheckCircle2, Loader2, MessageSquare, User, Send, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"
import { useAuthStore } from "@/stores/authStore"
import { getErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/utils"
import type { Ticket } from "@/types"

type BadgeVariant = "default" | "secondary" | "accent" | "destructive" | "warning" | "outline"

const STATUS_OPTIONS: { value: Ticket["status"]; label: string }[] = [
  { value: "open",             label: "Open" },
  { value: "assigned",         label: "Assigned" },
  { value: "in-progress",      label: "In Progress" },
  { value: "pending-approval", label: "Pending Approval" },
  { value: "on-hold",          label: "On Hold" },
  { value: "resolved",         label: "Resolved" },
  { value: "closed",           label: "Closed" },
  { value: "reopened",         label: "Reopened" },
]

const PRIORITY_OPTIONS: { value: Ticket["priority"]; label: string }[] = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
]

const statusVariant = (s: string): BadgeVariant => {
  if (s === "open" || s === "reopened") return "warning"
  if (s === "resolved" || s === "closed") return "accent"
  if (s === "on-hold" || s === "pending-approval") return "secondary"
  return "default"
}

const priorityVariant = (p: string): BadgeVariant => {
  if (p === "urgent") return "destructive"
  if (p === "high")   return "warning"
  if (p === "low")    return "secondary"
  return "default"
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tickets, updateTicket, resolveTicket, assignTicket, addComment } = useTicketStore()
  const { users } = useUserStore()
  const { user } = useAuthStore()

  const ticket = tickets.find((t) => t.id === id)
  const isAdmin = user?.role === "admin" || user?.role === "super-admin"

  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ticket && id) {
      // Not in store yet, go back
      navigate(-1)
    }
  }, [ticket, id, navigate])

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === ticket.status) return
    setUpdatingStatus(true)
    setError("")
    try {
      await updateTicket(ticket.id, { status: newStatus as Ticket["status"] })
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update status"))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (newPriority === ticket.priority) return
    try {
      await updateTicket(ticket.id, { priority: newPriority as Ticket["priority"] })
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update priority"))
    }
  }

  const handleAssign = async (userId: string) => {
    const assignedUser = users.find((u) => u.id === userId)
    if (!assignedUser) return
    try {
      await assignTicket(ticket.id, userId, assignedUser.name)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to assign ticket"))
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    setError("")
    try {
      await resolveTicket(ticket.id)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to resolve ticket"))
    } finally {
      setResolving(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setSubmittingComment(true)
    try {
      await addComment(ticket.id, {
        ticketId: ticket.id,
        userId: user!.id,
        userName: user!.name,
        content: comment.trim(),
      })
      setComment("")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to add comment"))
    } finally {
      setSubmittingComment(false)
    }
  }

  const isResolved = ticket.status === "resolved" || ticket.status === "closed"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-primary font-semibold">{ticket.ticketNumber}</span>
              <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
              <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
            </div>
            <h1 className="font-heading text-2xl font-bold mt-1">{ticket.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Created by {ticket.createdByName} · {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        {isAdmin && !isResolved && (
          <Button onClick={handleResolve} disabled={resolving} className="shrink-0">
            {resolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Mark Resolved
          </Button>
        )}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              {ticket.assetName && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Related Asset</p>
                  <p className="text-sm font-medium">{ticket.assetName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({ticket.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((c, i) => (
                  <div key={c.id || i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{c.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}

              <Separator />
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment() }}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddComment} disabled={!comment.trim() || submittingComment}>
                      {submittingComment ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                {isAdmin ? (
                  <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</label>
                {isAdmin ? (
                  <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
                <p className="text-sm capitalize">{ticket.type}</p>
              </div>

              {/* Assign to */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</label>
                  <Select value={ticket.assignedTo || ""} onValueChange={handleAssign}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((u) => u.role !== "member").map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isAdmin && ticket.assignedToName && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</label>
                  <p className="text-sm">{ticket.assignedToName}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Created {formatDate(ticket.createdAt)}</span>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                    <span>Resolved {formatDate(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
