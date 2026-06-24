import { useState } from "react"
import { Plus, Search, User, ArrowRightLeft, CheckCircle, Clock, Building2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssetStore } from "@/stores/assetStore"
import { useUserStore } from "@/stores/userStore"
import { formatDate } from "@/lib/utils"
import { getBranchOptions, normalizeBranch } from "@/lib/branches"

export function Allocations() {
  const { assets, assignAsset, returnAsset } = useAssetStore()
  const { users } = useUserStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [transferAssetId, setTransferAssetId] = useState<string | null>(null)
  const [transferUserId, setTransferUserId] = useState("")

  const members = users.filter((u) => u.role === "member" && u.status === "active")
  const branchOptions = getBranchOptions([...assets.map((asset) => asset.branch), ...members.map((member) => member.branch)])
  const transferAsset = transferAssetId ? assets.find((a) => a.id === transferAssetId) : null
  const selectedAssetRecord = selectedAsset ? assets.find((a) => a.id === selectedAsset) : null
  const matchesBranch = (branch?: string) => branchFilter === "all" || normalizeBranch(branch) === branchFilter
  const filteredMembers = members.filter((member) => matchesBranch(member.branch))
  const assignmentMembers = selectedAssetRecord
    ? members.filter((member) => normalizeBranch(member.branch) === normalizeBranch(selectedAssetRecord.branch))
    : filteredMembers
  const availableAssets = assets.filter((asset) => asset.status === "available" && matchesBranch(asset.branch))

  const filteredAssets = assets.filter(
    (asset) =>
      matchesBranch(asset.branch) &&
      (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assignedTo?.includes(searchQuery) ||
        normalizeBranch(asset.branch).toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAssign = () => {
    if (selectedAsset && selectedUser) {
      const user = assignmentMembers.find((m) => m.id === selectedUser)
      if (user) {
        assignAsset(selectedAsset, selectedUser, user.name)
        setIsAssignDialogOpen(false)
        setSelectedAsset("")
        setSelectedUser("")
      }
    }
  }

  const handleTransfer = () => {
    if (transferAssetId && transferUserId) {
      const user = members.find((m) => m.id === transferUserId)
      if (user) {
        assignAsset(transferAssetId, transferUserId, user.name)
        setTransferAssetId(null)
        setTransferUserId("")
      }
    }
  }

  const handleReturn = (assetId: string) => {
    if (confirm("Mark this asset as returned?")) returnAsset(assetId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Asset Allocations</h1>
          <p className="text-muted-foreground">Manage asset assignments and transfers</p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Asset to User</DialogTitle>
              <DialogDescription>
                Select an asset and user to create assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Asset</Label>
                <Select value={selectedAsset} onValueChange={(value) => { setSelectedAsset(value); setSelectedUser("") }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets
                      .map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} — {normalizeBranch(asset.branch)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({normalizeBranch(member.branch)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!selectedAsset || !selectedUser}>
                Assign Asset
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
                placeholder="Search allocations..."
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
                <TableHead>Asset</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets
                .filter((a) => a.status === "assigned" || a.assignedTo)
                .map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.category} • {asset.serialNumber || "N/A"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>
                          {members.find((m) => m.id === asset.assignedTo)?.name ||
                            asset.assignedTo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{normalizeBranch(asset.branch)}</TableCell>
                    <TableCell>
                      <Badge variant="default">Assigned</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {asset.assignedAt ? formatDate(asset.assignedAt) : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(asset.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Return
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setTransferAssetId(asset.id); setTransferUserId("") }}
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Transfer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredAssets.filter((a) => a.status === "assigned" || a.assignedTo).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No assigned assets found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={!!transferAssetId} onOpenChange={(open) => { if (!open) setTransferAssetId(null) }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>
              Transfer <strong>{transferAsset?.name}</strong> to a different member.
              {transferAsset?.assignedTo && (
                <span className="block mt-1 text-xs">
                  Currently assigned to: <strong>{members.find((m) => m.id === transferAsset.assignedTo)?.name || transferAsset.assignedTo}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>Transfer To</Label>
            <Select value={transferUserId} onValueChange={setTransferUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new member" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.id !== transferAsset?.assignedTo)
                  .filter((m) => normalizeBranch(m.branch) === normalizeBranch(transferAsset?.branch))
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} — {normalizeBranch(member.branch)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferAssetId(null)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={!transferUserId}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
