import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Search, Filter, Download, Upload, MoreHorizontal, Edit,
  Trash2, Mail, UserX, CheckCircle, FileSpreadsheet, Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserStore } from "@/stores/userStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportToExcel, parseFile, mapMemberRow, downloadMemberTemplate } from "@/lib/csv"
import { getErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/utils"
import { DEFAULT_BRANCH, getBranchOptions, normalizeBranch } from "@/lib/branches"

export function Members() {
  const { users, departments, addUser, toggleUserStatus, deleteUser, importUsersFromCSV } = useUserStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", email: "", department: "", branch: DEFAULT_BRANCH, phone: "", password: "" })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importMsg, setImportMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const branchOptions = getBranchOptions(users.filter((u) => u.role === "member").map((u) => u.branch))

  const setAddField = (field: keyof typeof addForm, value: string) => {
    setAddForm((current) => ({ ...current, [field]: value }))
  }

  const handleAddMember = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || addForm.password.length < 8) {
      setAddError("Name, email, and an 8+ character initial password are required")
      return
    }
    setAddLoading(true)
    setAddError("")
    try {
      await addUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        department: addForm.department || undefined,
        branch: addForm.branch || undefined,
        phone: addForm.phone || undefined,
        password: addForm.password,
        role: "member",
        status: "active",
      })
      setAddForm({ name: "", email: "", department: "", branch: DEFAULT_BRANCH, phone: "", password: "" })
      setIsAddDialogOpen(false)
    } catch (error: unknown) {
      setAddError(getErrorMessage(error, "Failed to create member"))
    } finally {
      setAddLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setImportMsg("")
    try {
      const data = users.filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          normalizeBranch(u.branch).toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || u.status === statusFilter
        const matchesBranch = branchFilter === "all" || normalizeBranch(u.branch) === branchFilter
        return u.role === "member" && matchesSearch && matchesStatus && matchesBranch
      }).map((u) => ({
      Name: u.name, Email: u.email, Department: u.department || "",
      Branch: normalizeBranch(u.branch),
      Phone: u.phone || "", Status: u.status, Role: u.role,
      "Created At": formatDate(u.createdAt), "Last Login": u.lastLogin ? formatDate(u.lastLogin) : "",
    }))
      await exportToExcel(`members-export-${new Date().toISOString().slice(0,10)}`, "Members", data)
      setImportMsg(`Export ready: ${data.length} members`)
    } catch {
      setImportMsg("Export failed — please try again")
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true); setImportMsg("")
    try {
      const rows = await parseFile(file)
      const mapped = rows
        .map(mapMemberRow)
        .filter((r) => r.name && r.email)
        .map((r) => ({ ...r, role: r.role === "admin" ? "admin" as const : "member" as const }))
      let success = 0, failed = 0
      for (const m of mapped) {
        try { await importUsersFromCSV([m]); success++ } catch { failed++ }
      }
      setImportMsg(`Import complete: ${success} added${failed ? `, ${failed} failed` : ""}`)
    } catch {
      setImportMsg("Import failed — upload a valid CSV or XLSX file")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      normalizeBranch(user.branch).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesBranch = branchFilter === "all" || normalizeBranch(user.branch) === branchFilter
    return matchesSearch && matchesStatus && matchesBranch
  })

  const members = filteredUsers.filter((u) => u.role === "member")

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this member?")) {
      deleteUser(id)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      {importMsg && (
        <Alert variant={importMsg.includes("failed") ? "destructive" : "default"}>
          <AlertDescription>{importMsg}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage organization members</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileRef.current?.click()} disabled={importing}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import CSV / XLSX"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadMemberTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Create a new member account for your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {addError && (
                  <Alert variant="destructive">
                    <AlertDescription>{addError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={addForm.name} onChange={(e) => setAddField("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" value={addForm.email} onChange={(e) => setAddField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={addForm.department} onValueChange={(value) => setAddField("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={addForm.branch} onValueChange={(value) => setAddField("branch", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 9876543210" value={addForm.phone} onChange={(e) => setAddField("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input id="password" type="password" placeholder="At least 8 characters" value={addForm.password} onChange={(e) => setAddField("password", e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by branch" />
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((user) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/members/${user.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary text-white">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>{normalizeBranch(user.branch)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "accent" : "secondary"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                          {user.status === "active" ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
