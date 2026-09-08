"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { BookOpen, Eye, EyeOff } from "lucide-react"
import {
  colleges,
  departmentMap,
  getAvailableSemestersForCollegeAndYear,
  getAvailableYearsForCollege,
  semesters,
} from "@/lib/student-profile"
import { registerUser } from "@/app/actions/auth" // Import your server action

export default function SignUpPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    department: "",
    year: "",
    semester: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const departmentOptions = useMemo(() => (form.college ? departmentMap[form.college] || [] : []), [form.college])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => {
      if (field === "college") {
        const nextCollege = value
        const isFreshman = nextCollege === "Freshman"
        const defaultYear = isFreshman ? "Year 1" : "Year 2"
        const defaultSemester = isFreshman ? "Semester 1" : "Semester 1"

        return {
          ...current,
          college: nextCollege,
          department: isFreshman ? "General Freshman" : "",
          year: defaultYear,
          semester: defaultSemester,
        }
      }

      if (field === "department") {
        const nextDepartment = value
        if (current.college === "Freshman") {
          return { ...current, department: nextDepartment, year: "Year 1", semester: "Semester 1" }
        }

        const isPreProgram = (current.college === "Engineering" && nextDepartment === "Pre Engineering") || (current.college === "Applied Science" && nextDepartment === "Pre Applied")
        const nextYear = isPreProgram ? "Year 1" : getAvailableYearsForCollege(current.college)[0] || ""
        const validSemesters = getAvailableSemestersForCollegeAndYear(current.college, nextYear)

        return {
          ...current,
          department: nextDepartment,
          year: nextYear,
          semester: validSemesters.includes(current.semester) ? current.semester : validSemesters[0] || "",
        }
      }

      if (field === "year") {
        const validSemesters = getAvailableSemestersForCollegeAndYear(current.college, value)
        return {
          ...current,
          year: value,
          semester: validSemesters.includes(current.semester) ? current.semester : validSemesters[0] || "",
        }
      }

      return { ...current, [field]: value }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await registerUser(form)

      if (res?.error) {
        setError(res.error)
        setLoading(false)
        return
      }

      router.push("/signin")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-7 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">AASTU Muslim Sisters</p>
            <p className="text-sm text-muted-foreground">Create your account</p>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose your academic details so your resources stay relevant.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1.5 block font-medium">Full name</span>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Amina Ali"
              required
            />
          </label>

          <label className="block text-sm md:col-span-2">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="yourname@email.com"
              required
            />
          </label>

          <label className="block text-sm md:col-span-2">
            <span className="mb-1.5 block font-medium">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 pr-10 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Create a password"
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

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">College</span>
            <select
              value={form.college}
              onChange={(e) => handleChange("college", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              <option value="">Choose college</option>
              {colleges.map((college) => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Department</span>
            <select
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              disabled={!form.college}
              required
            >
              <option value="">Choose department</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </label>

          {form.college && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Year</span>
              <select
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                required
              >
                {getAvailableYearsForCollege(form.college, form.department).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          )}

          {form.college && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Semester</span>
              <select
                value={form.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                required
              >
                {getAvailableSemestersForCollegeAndYear(form.college, form.year).map((semester) => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-70 md:col-span-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  )
}