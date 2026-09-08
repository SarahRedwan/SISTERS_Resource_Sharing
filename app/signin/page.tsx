"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Eye, EyeOff } from "lucide-react"
import { signInStudent } from "@/lib/student-profile"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = signInStudent(email, password)
      if (!user) {
        setError("Incorrect email or password.")
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Could not sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">AASTU Muslim Sisters</p>
            <p className="text-sm text-muted-foreground">Welcome back</p>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Access your personalized resources and study space.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="yourname@aastu.edu.et"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don’t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </main>
  )
}
