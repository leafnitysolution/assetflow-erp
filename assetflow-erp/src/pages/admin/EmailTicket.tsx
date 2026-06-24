import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Mail, Wand2, TicketIcon, AlertCircle, CheckCircle2,
  User, Tag, AlignLeft, ArrowRight, RotateCcw, Hash, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"
import { useAssetStore } from "@/stores/assetStore"
import type { TicketPriority, TicketType, User as UserType } from "@/types"

/* ─── Email Parser ─────────────────────────────────────────── */

function extractEmail(raw: string): string | null {
  const m = raw.match(/[\w.+-]+@[\w-]+\.[a-zA-Z.]{2,}/)
  return m ? m[0].toLowerCase() : null
}

function parseEmailText(text: string) {
  const lines = text.split("\n")
  const headers: Record<string, string> = {}

  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(/^(From|Subject|To|Date|Reply-To):\s*(.+)/i)
    if (headerMatch) {
      headers[headerMatch[1].toLowerCase()] = headerMatch[2].trim()
    } else if (lines[i].trim() === "" && i > 0 && Object.keys(headers).length > 0) {
      bodyStart = i + 1
      break
    }
  }

  const body = lines.slice(bodyStart).join("\n").trim()
  const fromEmail = headers["from"] ? extractEmail(headers["from"]) : extractEmail(text)
  const subject = headers["subject"] || ""

  return { fromEmail, subject, body }
}

function detectPriority(text: string): TicketPriority {
  const lower = text.toLowerCase()
  if (/urgent|asap|immediately|critical|emergency|right now/.test(lower)) return "urgent"
  if (/high priority|important|serious|severe|escalate/.test(lower)) return "high"
  if (/low priority|minor|whenever|no rush|at your convenience/.test(lower)) return "low"
  return "medium"
}

function detectType(text: string): TicketType {
  const lower = text.toLowerCase()
  if (/lost|missing|cannot find|stolen|can't find/.test(lower)) return "lost"
  if (/damage|damaged|broken|cracked|bent|smashed/.test(lower)) return "damage"
  if (/replac|new unit|new device|swap|substitute/.test(lower)) return "replacement"
  if (/maintenan|service|clean|inspect|check up|repair|fix|overhaul/.test(lower)) return "maintenance"
  return "issue"
}

/* ─── Parsed Result type ────────────────────────────────────── */
interface ParsedTicket {
  title: string
  description: string
  priority: TicketPriority
  type: TicketType
  fromEmail: string | null
  matchedUser: UserType | null
  rawEmail: string
}

/* ─── Component ─────────────────────────────────────────────── */
export function EmailTicket() {
  const navigate = useNavigate()
  const { addTicket } = useTicketStore()
  const { users } = useUserStore()
  const { assets } = useAssetStore()
  const [emailText, setEmailText] = useState("")
  const [parsed, setParsed] = useState<ParsedTicket | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // editable fields after parse
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TicketPriority>("medium")
  const [type, setType] = useState<TicketType>("issue")
  const [overrideUserId, setOverrideUserId] = useState<string>("")
  const [linkedAssetId, setLinkedAssetId] = useState<string>("")

  const members = users.filter((u) => u.role === "member" && u.status === "active")

  const handleParse = () => {
    setError(null)
    if (!emailText.trim()) { setError("Paste an email first."); return }

    const { fromEmail, subject, body } = parseEmailText(emailText)

    const matchedUser = fromEmail
      ? users.find((u) => u.email.toLowerCase() === fromEmail) ?? null
      : null

    const detectedPriority = detectPriority(`${subject} ${body}`)
    const detectedType = detectType(`${subject} ${body}`)

    const parsedResult: ParsedTicket = {
      title: subject || "Service Request",
      description: body || emailText,
      priority: detectedPriority,
      type: detectedType,
      fromEmail,
      matchedUser,
      rawEmail: emailText,
    }

    setParsed(parsedResult)
    setTitle(parsedResult.title)
    setDescription(parsedResult.description)
    setPriority(parsedResult.priority)
    setType(parsedResult.type)
    setOverrideUserId(matchedUser?.id ?? "")
    setLinkedAssetId("")
  }

  const handleCreate = () => {
    if (!parsed) return
    if (!overrideUserId) { setError("Please select the member this ticket belongs to."); return }

    const creatorUser = users.find((u) => u.id === overrideUserId)
    const linkedAsset = (linkedAssetId && linkedAssetId !== "none") ? assets.find((a) => a.id === linkedAssetId) : undefined

    addTicket({
      title,
      description,
      priority,
      type,
      status: "open",
      source: "email",
      rawEmail: parsed.rawEmail,
      createdBy: overrideUserId,
      createdByName: creatorUser?.name ?? "Unknown",
      assetId: linkedAsset?.id,
      assetName: linkedAsset?.name,
    })

    setCreated(creatorUser?.name ?? "Member")
  }

  const handleReset = () => {
    setEmailText("")
    setParsed(null)
    setCreated(null)
    setError(null)
    setTitle(""); setDescription(""); setOverrideUserId(""); setLinkedAssetId("")
  }

  /* ─── Success state ─── */
  if (created) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-heading text-2xl font-bold">Ticket Created!</h2>
        <p className="text-muted-foreground">
          A new ticket has been created on behalf of <strong>{created}</strong>.
          It is now visible in their member panel under <em>My Tickets</em>.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => navigate("/tickets")}>
            <TicketIcon className="mr-2 h-4 w-4" /> View Tickets
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <Mail className="mr-2 h-4 w-4" /> Parse Another Email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Email → Ticket</h1>
        <p className="text-muted-foreground">
          Paste a service-request email and the system will auto-generate a ticket
          for the registered member.
        </p>
      </div>

      {!parsed ? (
        /* ── Step 1: Paste email ── */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Paste Email Content
            </CardTitle>
            <CardDescription>
              Include headers like <code>From:</code>, <code>Subject:</code> for best auto-detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder={`From: jane.member@assetflow.com\nSubject: My laptop screen is broken\n\nHi team,\n\nMy MacBook Pro screen has a crack. This is urgent as I have a meeting tomorrow morning.\nPlease arrange a replacement ASAP.\n\nThanks,\nJane`}
              className="min-h-[240px] font-mono text-sm"
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />{error}
              </p>
            )}
            <div className="flex justify-end">
              <Button onClick={handleParse} className="gap-2">
                <Wand2 className="h-4 w-4" />
                Parse & Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── Step 2: Review & edit ── */
        <div className="space-y-4">
          {/* Sender match */}
          <Card className={parsed.matchedUser ? "border-accent/40" : "border-warning/40"}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${parsed.matchedUser ? "bg-accent/10" : "bg-warning/10"}`}>
                <User className={`h-5 w-5 ${parsed.matchedUser ? "text-accent" : "text-warning"}`} />
              </div>
              <div className="flex-1">
                {parsed.matchedUser ? (
                  <>
                    <p className="font-medium">{parsed.matchedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{parsed.matchedUser.email} · {parsed.matchedUser.department || "No dept"}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-warning">Sender not found</p>
                    <p className="text-xs text-muted-foreground">
                      {parsed.fromEmail ? `Email: ${parsed.fromEmail}` : "No 'From:' header detected"}
                    </p>
                  </>
                )}
              </div>
              <Badge variant={parsed.matchedUser ? "accent" : "warning"}>
                {parsed.matchedUser ? "Matched" : "Unmatched"}
              </Badge>
            </CardContent>
          </Card>

          {/* Detected fields */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wand2 className="h-4 w-4" />
              <span>Auto-detected — you can edit all fields below before creating the ticket.</span>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TicketIcon className="h-4 w-4" />Ticket Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">Subject / Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="flex items-center gap-2"><AlignLeft className="h-3.5 w-3.5" />Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">🔴 Urgent</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issue">Issue</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Member override */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" />Assign to Member *</Label>
                <Select value={overrideUserId} onValueChange={setOverrideUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This ticket will appear in the selected member's panel.</p>
              </div>

              {/* Optional asset link */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" />Link Asset (optional)</Label>
                <Select value={linkedAssetId} onValueChange={setLinkedAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No asset —</SelectItem>
                    {assets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />{error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
            <Button onClick={handleCreate} disabled={!overrideUserId} className="gap-2">
              <Hash className="h-4 w-4" />
              Create Ticket
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* How it works */}
      {!parsed && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />How auto-detection works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1.5">
            <p>• <strong>From:</strong> header email → matched against registered members</p>
            <p>• <strong>Subject:</strong> becomes the ticket title</p>
            <p>• Email body → ticket description</p>
            <p>• Keywords like <em>urgent, ASAP, critical</em> → priority detection</p>
            <p>• Keywords like <em>repair, replace, lost, damage</em> → type detection</p>
            <p>• All fields are editable before the ticket is created</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
