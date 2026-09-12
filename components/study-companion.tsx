"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Loader2,
  Moon,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { put } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { updateUserProfile } from "@/app/actions/auth"
import {
  colleges,
  departmentMap,
  getAvailableSemestersForCollegeAndYear,
  getAvailableYearsForCollege,
  getCurrentStudentProfile,
  normalizeAcademicSelection,
  saveStudentProfile,
  semesters,
  signOutStudent,
  type StudentProfile,
} from "@/lib/student-profile"

type Resource = {
  id: string
  college: string
  department: string
  year: string
  semester: string
  course: string
  type: string
  instructor?: string
  description?: string
  title?: string
  fileName?: string
  fileUrl?: string
  mimeType?: string
  createdAt: string
}

const types = ["All types", "Notes", "Textbooks", "PPTs", "Quiz", "Mid Exams", "Final Exams", "Other"]

function requiresInstructor(type: string) {
  return ["ppt", "ppts", "quiz"].includes(type.trim().toLowerCase())
}
const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "xml", "js", "ts", "html", "css", "log"]

function isPreviewable(mimeType: string, fileName?: string): boolean {
  const mime = mimeType.toLowerCase()
  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime.startsWith("text/") ||
    mime === "application/pdf"
  ) {
    return true
  }
  const ext = (fileName?.toLowerCase().split(".").pop() || "")
  return TEXT_EXTENSIONS.includes(ext)
}

function inlinePreviewUrl(fileUrl: string): string {
  if (fileUrl.startsWith("/api/file?")) {
    const url = new URL(fileUrl, window.location.origin)
    url.searchParams.set("inline", "1")
    return url.toString()
  }
  return fileUrl
}

type UploadConfig = { mode: "client" | "server"; access: "public" | "private"; maxFileSize: number }
let uploadConfigPromise: Promise<UploadConfig> | null = null

function getUploadConfig(): Promise<UploadConfig> {
  uploadConfigPromise ??= fetch("/api/upload")
    .then((r) => r.json())
    .then((d): UploadConfig => ({
      mode: d.uploadMode === "client" ? "client" : "server",
      access: d.access === "public" ? "public" : "private",
      maxFileSize: Number(d.maxFileSize) || 50 * 1024 * 1024,
    }))
    .catch((): UploadConfig => ({ mode: "server", access: "private", maxFileSize: 50 * 1024 * 1024 }))
  return uploadConfigPromise
}
const FOCUS_SECONDS = 25 * 60

export function StudyCompanion() {
  const router = useRouter()
  const [tab, setTab] = useState<"home" | "resources" | "dashboard" | "profile" | "share">("home")
  const [dark, setDark] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [ready, setReady] = useState(false)

  const [college, setCollege] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [semester, setSemester] = useState("")
  const [type, setType] = useState("All types")
  const [query, setQuery] = useState("")

  const [seconds, setSeconds] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  const syncProfile = useCallback(() => {
    const currentProfile = getCurrentStudentProfile()
    setProfile(currentProfile)
    if (currentProfile) {
      setCollege(currentProfile.college)
      setDepartment(currentProfile.department)
      setYear(currentProfile.year)
      setSemester(currentProfile.semester)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    syncProfile()
    window.addEventListener("student-profile-updated", syncProfile)
    return () => window.removeEventListener("student-profile-updated", syncProfile)
  }, [syncProfile])

  const loadResources = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const activeCollege = profile?.college || college
      const activeDepartment = profile?.department || department
      const activeYear = profile?.year || year
      const activeSemester = profile?.semester || semester

      const params = new URLSearchParams()
      if (activeCollege) params.set("college", activeCollege)
      if (activeDepartment) params.set("department", activeDepartment)
      if (activeYear) params.set("year", activeYear)
      if (activeSemester) params.set("semester", activeSemester)

      const res = await fetch(`/api/resources?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load resources")
      setResources((await res.json()) as Resource[])
    } catch {
      setLoadError("Could not load resources. Please refresh to try again.")
    } finally {
      setLoading(false)
    }
  }, [college, department, year, semester, profile])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false)
      setSessions((s) => s + 1)
    }
  }, [seconds, running])

  const activeCollege = profile?.college || college
  const activeDepartment = profile?.department || department
  const activeYear = profile?.year || year
  const activeSemester = profile?.semester || semester

  const filtered = useMemo(
    () =>
      resources.filter(
        (r) =>
          (!activeCollege || r.college === activeCollege) &&
          (!activeDepartment || r.department === activeDepartment) &&
          (!activeYear || r.year === activeYear) &&
          (!activeSemester || r.semester === activeSemester) &&
          (type === "All types" || r.type === type) &&
          [r.course, r.department, r.description || "", r.title].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [resources, activeCollege, activeDepartment, activeYear, activeSemester, type, query],
  )

  const choose = (kind: string, value: string) => {
    const nextSelection = normalizeAcademicSelection(
      kind === "college" ? value : college || profile?.college || "",
      kind === "department" ? value : department || profile?.department || "",
      kind === "year" ? value : year || profile?.year || "",
      kind === "semester" ? value : semester || profile?.semester || "",
    )

    if (profile && (kind === "college" || kind === "department" || kind === "year" || kind === "semester")) {
      const nextProfile: StudentProfile = {
        ...profile,
        college: kind === "college" ? nextSelection.college : profile.college,
        department: kind === "department" ? nextSelection.department : profile.department,
        year: kind === "year" ? nextSelection.year : profile.year,
        semester: kind === "semester" ? nextSelection.semester : profile.semester,
      }

      if (kind === "college") {
        nextProfile.department = nextSelection.department
        nextProfile.year = nextSelection.year
        nextProfile.semester = nextSelection.semester
      }

      if (kind === "year") {
        nextProfile.semester = nextSelection.semester
      }

      saveStudentProfile(nextProfile)
      setProfile(nextProfile)
      setCollege(nextProfile.college)
      setDepartment(nextProfile.department)
      setYear(nextProfile.year)
      setSemester(nextProfile.semester)
      return
    }

    if (kind === "college") {
      setCollege(nextSelection.college)
      setDepartment(nextSelection.department)
      setYear(nextSelection.year)
      setSemester(nextSelection.semester)
      setType("All types")
    }
    if (kind === "department") {
      setDepartment(value)
      setYear("")
      setSemester("")
      setType("All types")
    }
    if (kind === "year") {
      setYear(nextSelection.year)
      setSemester(nextSelection.semester)
      setType("All types")
    }
    if (kind === "semester") setSemester(value)
  }

  const handleSignOut = () => {
    signOutStudent()
    setProfile(null)
    setCollege("")
    setDepartment("")
    setYear("")
    setSemester("")
    setTab("home")
    router.push("/signin")
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  if (!ready) {
    return null
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3 text-left">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <BookOpen />
              </span>
              <span>
                <span className="block font-semibold tracking-tight">AASTU Muslim Sisters</span>
                <span className="hidden text-xs text-muted-foreground sm:block">Learn with purpose</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-xl md:p-12">
            <div className="grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
              <div>
                <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-7xl">
                  Study steadily.
                  <br />
                  <span className="text-primary">Grow together.</span>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                  A calm, trusted space for Muslim sisters at AASTU to find notes, share what they know, and build a study rhythm that lasts.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => router.push("/signin")}>
                    Sign in
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push("/signup")}>
                    Sign up
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/20 md:p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm opacity-75">A little progress</p>
                      <p className="mt-1 text-3xl font-semibold">Every day counts.</p>
                    </div>
                    <Flame className="size-7" />
                  </div>
                  <div className="mt-10 rounded-3xl bg-primary-foreground/10 p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span>Weekly focus</span>
                      <span>68%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-primary-foreground/20">
                      <div className="h-2 w-[68%] rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-5 rounded-2xl border border-border bg-card p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Shared by sisters</p>
                      <p className="text-xs text-muted-foreground">Notes that help you move forward</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <button onClick={() => setTab("home")} className="flex items-center gap-3 text-left">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BookOpen />
            </span>
            <span>
              <span className="block font-semibold tracking-tight">AASTU Muslim Sisters</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Learn with purpose</span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 md:flex">
            {(
              [
                ["home", "Home"],
                ["resources", "Resources"],
                ["share", "Share"],
                ["dashboard", "My dashboard"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm transition ${tab === key ? "bg-background font-medium shadow-sm" : ""}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:border-primary/50"
            >
              Sign out
            </button>
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun /> : <Moon />}
            </Button>
            <button
              aria-label="Open profile"
              onClick={() => setTab("profile")}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20"
              title="Profile"
            >
              {profile.name?.charAt(0)?.toUpperCase() || "S"}
            </button>
          </div>
        </div>
      </header>

      {tab === "home" && <Home onExplore={() => setTab("resources")} onTimer={() => setTab("dashboard")} />}

      {tab === "resources" && (
        <Resources
          college={activeCollege}
          department={activeDepartment}
          year={activeYear}
          semester={activeSemester}
          type={type}
          query={query}
          filtered={filtered}
          loading={loading}
          loadError={loadError}
          setQuery={setQuery}
          setType={setType}
          choose={choose}
          onSaved={() => {
            loadResources()
          }}
        />
      )}

      {tab === "share" && (
        <ShareResource
          college={activeCollege}
          department={activeDepartment}
          year={activeYear}
          semester={activeSemester}
          onSaved={(resource) => {
            setResources((current) => [resource, ...current.filter((item) => item.id !== resource.id)])
            setTab("resources")
          }}
        />
      )}

      {tab === "dashboard" && (
        <Dashboard
          clock={clock}
          running={running}
          setRunning={setRunning}
          sessions={sessions}
          setSessions={setSessions}
          seconds={seconds}
          setSeconds={setSeconds}
          resourceCount={filtered.length}
        />
      )}

      {tab === "profile" && profile && (
        <ProfileEditor
          profile={profile}
          onSaved={(nextProfile) => {
            setProfile(nextProfile)
            setCollege(nextProfile.college)
            setDepartment(nextProfile.department)
            setYear(nextProfile.year)
            setSemester(nextProfile.semester)
            setTab("resources")
          }}
        />
      )}

      <footer className="mx-auto mt-20 max-w-7xl border-t border-border px-5 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col justify-between gap-3 md:flex-row">
          <span>Built for AASTU Muslim Sisters.</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            A trusted space to learn and share
          </span>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-1 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 px-2">
          {(
            [
              ["home", "Home"],
              ["resources", "Resources"],
              ["share", "Share"],
              ["dashboard", "Dashboard"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-xl px-2 py-2 text-center text-xs font-medium transition ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  )
}

function Home({ onExplore, onTimer }: { onExplore: () => void; onTimer: () => void }) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-28">
          <div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-7xl">
              Study steadily.
              <br />
              <span className="text-primary">Grow together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              A calm, trusted space for Muslim sisters at AASTU to find notes, share what they know, and build a study
              rhythm that lasts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={onExplore}>
                Explore resources <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" onClick={onTimer}>
                Open study timer <Clock3 data-icon="inline-end" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/20 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-75">A little progress</p>
                  <p className="mt-1 text-3xl font-semibold">Every day counts.</p>
                </div>
                <Flame className="size-7" />
              </div>
              <div className="mt-10 rounded-3xl bg-primary-foreground/10 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span>Weekly focus</span>
                  <span>68%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-primary-foreground/20">
                  <div className="h-2 w-[68%] rounded-full bg-primary-foreground" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                  <Users className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Shared by sisters</p>
                  <p className="text-xs text-muted-foreground">Notes that help you move forward</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Step({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: StudentProfile
  onSaved: (profile: StudentProfile) => void
}) {
  const [form, setForm] = useState<StudentProfile>(profile)
  const [message, setMessage] = useState("")

  useEffect(() => {
    setForm(profile)
  }, [profile])

  const handleChange = (field: keyof StudentProfile, value: string) => {
    setForm((current) => {
      if (field === "college") {
        const isFreshman = value === "Freshman"
        return {
          ...current,
          college: value,
          department: isFreshman ? "General Freshman" : "",
          year: isFreshman ? "Year 1" : "Year 2",
          semester: "Semester 1",
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

      return {
        ...current,
        [field]: value,
      }
    })
  }

  const handleSave = async () => {
    setMessage("")
    const saved = await updateUserProfile({
      currentEmail: profile.email,
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      password: (form.password || "").trim(),
      college: form.college.trim(),
      department: form.department.trim(),
      year: form.year.trim(),
      semester: form.semester.trim(),
    })

    if (saved.error || !saved.user) {
      setMessage(saved.error || "Could not update your profile.")
      return
    }

    const nextProfile: StudentProfile = {
      ...saved.user,
      password: form.password?.trim() || profile.password || "",
    }
    saveStudentProfile(nextProfile)
    setMessage("Profile updated successfully.")
    onSaved(nextProfile)
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Student profile</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Update your academic details</h1>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-2 text-sm">{profile.email}</div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Full name
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="text-sm md:col-span-2">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="text-sm md:col-span-2">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="text-sm">
            College
            <select
              value={form.college}
              onChange={(e) => handleChange("college", e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Choose college</option>
              {colleges.map((college) => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Department
            <select
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              disabled={!form.college}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">Choose department</option>
              {(departmentMap[form.college] || []).map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </label>

          {form.college && (
            <label className="text-sm">
              Year
              <select
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              >
                {getAvailableYearsForCollege(form.college, form.department).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          )}

          {form.college && (
            <label className="text-sm">
              Semester
              <select
                value={form.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              >
                {getAvailableSemestersForCollegeAndYear(form.college, form.year).map((semester) => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{message || "Changing your semester updates the resources shown to you."}</p>
          <Button onClick={handleSave}>Save profile</Button>
        </div>
      </div>
    </section>
  )
}

function Resources(props: {
  college: string
  department: string
  year: string
  semester: string
  type: string
  query: string
  filtered: Resource[]
  loading: boolean
  loadError: string
  setQuery: (v: string) => void
  setType: (v: string) => void
  choose: (kind: string, value: string) => void
  onSaved: () => void
}) {
  const { college, department, year, semester, type, query, filtered, loading, loadError, setQuery, setType, choose, onSaved } = props
  const [preview, setPreview] = useState<Resource | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return
    try {
      const res = await fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (res.status === 204 || res.ok) {
        onSaved()
        return
      }
      const detail = await res.json().catch(() => null)
      alert(detail?.error || "Could not delete resource")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete resource")
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Resource library</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Find exactly what you need.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Your academic path is already saved to your profile, so the right resources show up automatically.</p>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-full bg-primary px-3 py-1.5 text-primary-foreground">1 College</span>
          {(
            [
              ["Department", department],
              ["Year", year],
              ["Semester", semester],
              ["Type", type === "All types" ? "Any type" : type],
            ] as const
          ).map(([label, value]) => (
            <span key={label} className="flex items-center gap-2">
              <ChevronRight className="size-3" />
              <span className={value ? "rounded-full bg-primary/10 px-3 py-1.5 text-primary" : ""}>{value || label}</span>
            </span>
          ))}
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-4">
          <Step label="College" value={college} options={colleges} onChange={(v) => choose("college", v)} />
          {college && <Step label="Department" value={department} options={departmentMap[college]} onChange={(v) => choose("department", v)} />}
          {college && <Step label="Year" value={year} options={getAvailableYearsForCollege(college)} onChange={(v) => choose("year", v)} />}
          {college && <Step label="Semester" value={semester} options={getAvailableSemestersForCollegeAndYear(college, year)} onChange={(v) => choose("semester", v)} />}
        </div>
        {semester && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm font-medium">What would you like to see?</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    type === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">{college ? `${college.replace("College of ", "")} resources` : "Choose a college to begin"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{college ? `${filtered.length} resources matched your path` : "Your library will appear here after you choose your academic path."}</p>
        </div>
      </div>

      {college && (
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses or departments"
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading && colleges && (
          <div className="col-span-full flex items-center justify-center gap-3 rounded-3xl border border-dashed border-border p-12 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            Loading resources…
          </div>
        )}
        {!loading && loadError && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <p>{loadError}</p>
            <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        )}
        {!loading && !loadError && college && filtered.map((r) => (
          <article key={r.id} className="group rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText />
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{r.type}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{r.course}</h3>
            {requiresInstructor(r.type) && r.instructor && <p className="mt-2 text-sm text-primary">Instructor: {r.instructor}</p>}
            {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>
                {r.department} · {r.year}
              </span>
              <div className="flex items-center gap-3">
                {r.fileUrl && (
                  <>
                    {isPreviewable(r.mimeType || "", r.fileName) && (
                      <button
                        onClick={() => setPreview(r)}
                        className="text-xs underline underline-offset-2 hover:opacity-90"
                      >
                        Preview
                      </button>
                    )}
                    <a href={r.fileUrl} download={r.fileName} className="text-xs underline hover:opacity-90">
                      Download
                    </a>
                  </>
                )}
                <button onClick={() => handleDelete(r.id)} className="text-xs text-destructive underline-offset-2 hover:underline">Delete</button>
              </div>
            </div>
          </article>
        ))}

        {!loading && !loadError && college && filtered.length === 0 && !query && type === "All types" && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center">
            <FolderOpen className="mx-auto size-8 text-primary" />
            <h3 className="mt-4 font-semibold">No resources yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try another filter or be the first sister to share something.</p>
          </div>
        )}
        {!loading && !loadError && college && filtered.length === 0 && (query || type !== "All types") && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No resources matched your search. Try a different query.
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{preview.fileName || preview.course}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {preview.course} · {preview.type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={preview.fileUrl}
                  download={preview.fileName}
                  className="text-sm underline underline-offset-2 hover:opacity-90"
                >
                  Download
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-muted p-4">
              <PreviewBody resource={preview} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewBody({ resource }: { resource: Resource }) {
  const url = inlinePreviewUrl(resource.fileUrl || "")
  const mime = (resource.mimeType || "").toLowerCase()

  if (mime.startsWith("image/")) {
    return <img src={url} alt={resource.fileName || resource.course} className="mx-auto max-h-[75vh] w-auto rounded-xl object-contain" />
  }
  if (mime.startsWith("video/")) {
    return <video controls src={url} className="mx-auto max-h-[75vh] w-auto rounded-xl" />
  }
  if (mime.startsWith("audio/")) {
    return <audio controls src={url} className="mx-auto w-full max-w-xl" />
  }
  return <iframe src={url} title="File preview" className="h-[75vh] w-full rounded-xl border-0 bg-white" />
}

function ShareResource({
  college,
  department,
  year,
  semester,
  onSaved,
}: {
  college: string
  department: string
  year: string
  semester: string
  onSaved: (resource: Resource) => void
}) {
  const maxFileSize = 50 * 1024 * 1024
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState("")

  const [shareCollege, setShareCollege] = useState(college)
  const [shareDepartment, setShareDepartment] = useState(department)
  const [shareYear, setShareYear] = useState(year)
  const [shareSemester, setShareSemester] = useState(semester)
  const [shareCourse, setShareCourse] = useState("")
  const [shareType, setShareType] = useState("")
  const [shareDescription, setShareDescription] = useState("")
  const [shareFile, setShareFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setShareCollege(college)
    setShareDepartment(department)
    setShareYear(year)
    setShareSemester(semester)
  }, [college, department, year, semester])

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (f.size > maxFileSize) {
      setShareFile(null)
      setShareMsg("File is too large. Maximum size is 50 MB.")
      return
    }
    setShareFile(f)
    setShareMsg("")
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const doServerUpload = async (file: File) => {
    try {
      setShareMsg("Uploading file...")
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/upload", { method: "POST", body: fd })
      if (!up.ok) {
        const data = await up.json().catch(() => null)
        setShareMsg(data?.error || "File upload failed")
        return null
      }
      const meta = await up.json()
      return { fileName: meta.fileName, fileUrl: meta.fileUrl, mimeType: meta.mimeType }
    } catch (err) {
      setShareMsg(err instanceof Error ? `Upload failed: ${err.message}` : "File upload failed")
      return null
    }
  }

  const submitShare = async () => {
    setShareMsg("")
    const missing = [] as string[]
    if (!shareCollege) missing.push("college")
    if (!shareDepartment) missing.push("department")
    if (!shareYear) missing.push("year")
    if (!shareSemester) missing.push("semester")
    if (!shareCourse || !String(shareCourse).trim()) missing.push("course")
    if (!shareType) missing.push("type")
    if (requiresInstructor(shareType) && !shareDescription.trim()) missing.push("instructor")
    if (!shareFile) missing.push("file")
    if (missing.length > 0) {
      setShareMsg(`Missing: ${missing.join(", ")}`)
      return
    }
    if (!shareFile) return
    const file = shareFile

    setShareLoading(true)
    try {
      setShareMsg("Uploading file...")
      let fileMeta: { fileName: string; fileUrl: string; mimeType: string } | null = null

      const uploadConfig = await getUploadConfig()
      if (uploadConfig.mode === "client") {
        try {
          setShareMsg("Uploading 0%...")
          const ext = file.name.includes(".") ? file.name.split(".").pop() : ""
          const storageName = `${crypto.randomUUID()}${ext ? "." + ext : ""}`

          const tokenRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pathname: storageName }),
          })
          if (!tokenRes.ok) {
            const errData = await tokenRes.json().catch(() => null)
            throw new Error(errData?.error || `Upload token request failed (${tokenRes.status})`)
          }
          const { clientToken } = (await tokenRes.json()) as { clientToken: string }

          const blob = await put(storageName, file, {
            access: uploadConfig.access,
            token: clientToken,
            onUploadProgress: ({ percentage }) => {
              setShareMsg(`Uploading ${Math.round(percentage)}%...`)
            },
          })
          fileMeta = {
            fileName: file.name,
            fileUrl: blob.url,
            mimeType: file.type || "application/octet-stream",
          }
        } catch (err) {
          console.error("Direct upload failed, using server upload:", err)
          setShareMsg(`Upload problem (${err instanceof Error ? err.message : "unknown"}) — retrying via server...`)
          const meta = await doServerUpload(file)
          if (meta === null) return
          fileMeta = meta
        }
      } else {
        const meta = await doServerUpload(file)
        if (meta === null) return
        fileMeta = meta
      }

      setShareMsg("Saving resource...")
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: shareCollege,
          department: shareDepartment,
          year: shareYear,
          semester: shareSemester,
          course: shareCourse,
          type: shareType,
          instructor: requiresInstructor(shareType) ? shareDescription : undefined,
          description: requiresInstructor(shareType) ? "" : shareDescription,
          fileName: fileMeta?.fileName,
          fileUrl: fileMeta?.fileUrl,
          mimeType: fileMeta?.mimeType,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        let data: { error?: string } | null = null
        try {
          data = JSON.parse(text)
        } catch {}
        setShareMsg(
          data?.error ||
            (text ? `Save failed (${res.status}): ${text.slice(0, 200)}` : `Save failed (${res.status})`),
        )
        return
      }

      const savedResource = (await res.json()) as Resource
      setShareMsg("Thanks — resource shared!")
      setShareCollege("")
      setShareDepartment("")
      setShareYear("")
      setShareSemester("")
      setShareCourse("")
      setShareType("")
      setShareDescription("")
      setShareFile(null)
      onSaved(savedResource)
    } catch (err) {
      setShareMsg(err instanceof Error && err.message ? err.message : "Could not add resource")
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Share resource</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Upload what helps your sisters.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Add notes, exams, presentations, and study materials for the right academic path.</p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            College
            <select className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareCollege} onChange={(e) => setShareCollege(e.target.value)}>
              <option value="">Choose college</option>
              {colleges.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Department
            <select className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareDepartment} onChange={(e) => setShareDepartment(e.target.value)}>
              <option value="">Choose department</option>
              {(departmentMap[shareCollege] || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          {shareCollege && (
            <label className="text-sm">
              Year
              <select className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareYear} onChange={(e) => setShareYear(e.target.value)}>
                {getAvailableYearsForCollege(shareCollege).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          )}
          {shareCollege && (
            <label className="text-sm">
              Semester
              <select className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareSemester} onChange={(e) => setShareSemester(e.target.value)}>
                {getAvailableSemestersForCollegeAndYear(shareCollege, shareYear).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm md:col-span-2">
            Course / Title
            <input className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareCourse} onChange={(e) => setShareCourse(e.target.value)} />
          </label>
          <label className="text-sm md:col-span-2">
            Type
            <select className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareType} onChange={(e) => setShareType(e.target.value)}>
              <option value="">Choose type</option>
              {types.filter((t) => t !== "All types").map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            {requiresInstructor(shareType) ? "Instructor name" : "Description (optional)"}
            <input className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2" value={shareDescription} onChange={(e) => setShareDescription(e.target.value)} />
          </label>
          <label className="text-sm md:col-span-2">
            File (required)
            <div
              onDrop={onDropFile}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex h-28 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-background text-sm text-muted-foreground"
            >
              {shareFile ? (
                <div>
                  {shareFile.name} ({Math.round(shareFile.size / 1024)} KB)
                </div>
              ) : (
                <div>Drop file here or click to choose</div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.mp4,.mp3"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > maxFileSize) {
                    setShareFile(null)
                    setShareMsg("File is too large. Maximum size is 50 MB.")
                    return
                  }
                  setShareFile(file)
                  setShareMsg("")
                }}
              />
            </div>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={submitShare} disabled={shareLoading}>{shareLoading ? "Sharing…" : "Share resource"}</Button>
          {shareMsg && <span className="text-sm text-muted-foreground">{shareMsg}</span>}
        </div>
      </div>
    </div>
  )
}

function Dashboard(props: {
  clock: string
  running: boolean
  setRunning: (v: boolean) => void
  sessions: number
  setSessions: (v: number) => void
  seconds: number
  setSeconds: (v: number) => void
  resourceCount: number
}) {
  const { clock, running, setRunning, sessions, setSessions, seconds, setSeconds, resourceCount } = props

  const toggle = () => {
    if (running) {
      setRunning(false)
      return
    }
    if (seconds === 0) setSeconds(FOCUS_SECONDS)
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setSeconds(FOCUS_SECONDS)
  }

  const resetSessions = () => setSessions(0)

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Study companion</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Make space for deep work.</h1>
      <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-border bg-card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's focus</p>
              <h2 className="mt-1 text-xl font-semibold">One focused session at a time.</h2>
            </div>
            <Brain className="text-primary" />
          </div>
          <p className="my-12 text-center font-mono text-7xl font-semibold tracking-tight">{props.clock}</p>
          <div className="flex justify-center gap-3">
            <Button size="lg" onClick={toggle}>
              {running ? "Pause" : "Start focus"}
              <Play data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
          {seconds === 0 && !running && (
            <p className="mt-4 text-center text-sm text-primary">Session complete — well done. Start again for another round.</p>
          )}
        </section>
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl bg-primary p-7 text-primary-foreground">
            <Clock3 />
            <p className="mt-8 text-4xl font-semibold">{sessions * 25 + 85} min</p>
            <p className="mt-1 opacity-80">of focused study this week</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your rhythm</h3>
              {sessions > 0 && (
                <button onClick={resetSessions} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                  Reset sessions
                </button>
              )}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold">7</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{resourceCount}</p>
                <p className="text-xs text-muted-foreground">Resources</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{sessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
