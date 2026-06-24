import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useUserStore } from "@/stores/userStore"

export function DataInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth, loading: authLoading } = useAuthStore()
  const { fetchAssets } = useAssetStore()
  const { fetchTickets } = useTicketStore()
  const { fetchUsers } = useUserStore()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Verify stored token on mount
  useEffect(() => {
    checkAuth().finally(() => setHasCheckedAuth(true))
  }, [checkAuth])

  // Fetch all data once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets()
      fetchTickets()
      fetchUsers()
    }
  }, [isAuthenticated, fetchAssets, fetchTickets, fetchUsers])

  if (!hasCheckedAuth && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading AssetFlow…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
