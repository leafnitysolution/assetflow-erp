import { useState } from "react"
import { Plus, Search, Shield, MoreHorizontal, Edit, Trash2, UserX, CheckCircle, Building2 } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserStore } from "@/stores/userStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/utils"
import { DEFAULT_BRANCH, getBranchOptions, normalizeBranch } from "@/lib/branches"
import type { UserRole } from "@/types"

export function AdminManagement() {
  const { users, addUser, toggleUserStatus, deleteUser } = useUserStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; branch: string; role: Extract<UserRole, "admin" | "super-admin"> }>({
    name: "",
    email: "",
    password: "",
    branch: DEFAULT_BRANCH,
    role: "admin",
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")
  const branchOptions = getBranchOptions(users.filter((user) => user.role === "admin" || user.role === "super-admin").map((user) => user.branch))

  const setAddField = (field: keyof typeof addForm, value: string) => {
    setAddForm((current) => ({ ...current, [field]: value }))
  }

  const handleAddAdmin = async () => {
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
        password: addForm.password,
        branch: addForm.branch || undefined,
        role: addForm.role,
        status: "active",
      })
      setAddForm({ name: "", email: "", password: "", branch: DEFAULT_BRANCH, role: "admin" })
      setIsAddDialogOpen(false)
    } catch (error: unknown) {
      setAddError(getErrorMessage(error, "Failed to create administrator"))
    } finally {
      setAddLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.role === "admin" || user.role === "super-admin") &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        normalizeBranch(user.branch).toLowerCase().includes(searchQuery.toLowerCase())) &&
      (branchFilter === "all" || normalizeBranch(user.branch) === branchFilter)
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this admin?")) {
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super-admin":
        return "bg-purple-500 hover:bg-purple-500"
      case "admin":
        return "bg-primary hover:bg-primary"
      default:
        return "bg-secondary hover:bg-secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Manage administrator accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Administrator</DialogTitle>
              <DialogDescription>Create a new admin account.</DialogDescription>
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
                <Input id="email" type="email" placeholder="admin@company.com" value={addForm.email} onChange={(e) => setAddField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input id="password" type="password" placeholder="At least 8 characters" value={addForm.password} onChange={(e) => setAddField("password", e.target.value)} />
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
                <Label htmlFor="role">Role</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={addForm.role}
                  onChange={(e) => setAddField("role", e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={addLoading}>
                {addLoading ? "Adding..." : "Add Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search admins..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </TableCell>
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
                  <TableCell>
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
