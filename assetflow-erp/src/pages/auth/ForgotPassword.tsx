import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Logo } from "@/components/layout/Logo"

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      await api.post("/auth/forgot-password", { email })
      setIsSubmitted(true)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to request password reset"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4">
            <Logo className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            AssetFlow ERP
          </h1>
          <p className="text-muted-foreground mt-2">
            Enterprise Asset Management System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">Check your email</h3>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to {email}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
