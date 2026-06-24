import { Camera, Mail, Building, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/authStore"
import { formatDate } from "@/lib/utils"

export function Profile() {
  const { user } = useAuthStore()

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
      case "member":
        return "bg-accent hover:bg-accent"
      default:
        return "bg-secondary hover:bg-secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-white text-4xl">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge className={`mt-2 ${getRoleBadgeColor(user?.role || "")}`}>
                {user?.role}
              </Badge>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.department || "No department"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{user?.role} Access</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-sm text-muted-foreground">{user?.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <p className="text-sm text-muted-foreground">
                  {user?.department || "Not assigned"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-muted-foreground">
                  {user?.phone || "Not provided"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Account Status</label>
              <div className="flex items-center gap-2">
                <Badge variant={user?.status === "active" ? "accent" : "secondary"}>
                  {user?.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last login: {user?.lastLogin ? formatDate(user.lastLogin) : "Never"}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Login</p>
                    <p className="text-xs text-muted-foreground">
                      Last successful login from Chrome on macOS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
