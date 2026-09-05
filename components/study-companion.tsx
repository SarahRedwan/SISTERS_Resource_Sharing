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
import { Button } from "@/components/ui/button"

type Resource = {
  id: string
  college: string
  department: string
  year: string
  semester: string
  course: string
  type: string
  description?: string
  title?: string
  fileName?: string
  fileUrl?: string
  mimeType?: string
  createdAt: string
}

const colleges = ["College of Engineering", "College of Applied Science"]
const departmentMap: Record<string, string[]> = {
  "College of Engineering": ["Software Engineering", "Information Technology", "Computer Science", "Electrical Engineering", "Civil Engineering"],
  "College of Applied Science": ["Applied Biology", "Applied Chemistry", "Food Science and Technology", "Textile Engineering", "Geology"],
}
const years = ["Freshman", "Year 2", "Year 3", "Year 4", "Year 5"]
const semesters = ["Semester 1", "Semester 2"]
const types = ["All types", "Notes", "PPTs", "Mid Exams", "Final Exams", "Other"]

const FOCUS_SECONDS = 25 * 60

export function StudyCompanion() {
  const [tab, setTab] = useState<"home" | "resources" | "dashboard">("home")
  const [dark, setDark] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [college, setCollege] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [semester, setSemester] = useState("")
  const [type, setType] = useState("All types")
  const [query, setQuery] = useState("")

  const [seconds, setSeconds] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  const loadResources = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const res = await fetch("/api/resources")
      if (!res.ok) throw new Error("Failed to load resources")
      setResources((await res.json()) as Resource[])
    } catch {
      setLoadError("Could not load resources. Please refresh to try again.")
    } finally {
      setLoading(false)
    }
  }, [])

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

  const filtered = useMemo(
    () =>
      resources.filter(
        (r) =>
          (!college || r.college === college) &&
          (!department || r.department === department) &&
          (!year || r.year === year) &&
          (!semester || r.semester === semester) &&
          (type === "All types" || r.type === type) &&
          [r.course, r.department, r.description || "", r.title].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [resources, college, department, year, semester, type, query],
  )

  const choose = (kind: string, value: string) => {
    if (kind === "college") {
      setCollege(value)
      setDepartment("")
      setYear("")
      setSemester("")
      setType("All types")
    }
    if (kind === "department") {
      setDepartment(value)
      setYear("")
      setSemester("")
      setType("All types")
    }
    if (kind === "year") {
      setYear(value)
      setSemester("")
      setType("All types")
    }
    if (kind === "semester") setSemester(value)
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <button onClick={() => setTab("home")} className="flex items-center gap-3 text-left">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BookOpen />
            </span>
            <span>
              <span className="block font-semibold tracking-tight">AASTU Muslim Sisters</span>
              <span className="block text-xs text-muted-foreground">Learn with purpose</span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 md:flex">
            {(
              [
                ["home", "Home"],
                ["resources", "Resources"],
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
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      {tab === "home" && <Home onExplore={() => setTab("resources")} onTimer={() => setTab("dashboard")} />}

      {tab === "resources" && (
        <Resources
          college={college}
          department={department}
          year={year}
          semester={semester}
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

      {tab === "dashboard" && (
        <Dashboard
          clock={clock}
          running={running}
          setRunning={setRunning}
          sessions={sessions}
          setSessions={setSessions}
          seconds={seconds}
          setSeconds={setSeconds}
          resourceCount={resources.length}
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
    </main>
  )
}

function Home({ onExplore, onTimer }: { onExplore: () => void; onTimer: () => void }) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary">
              <Sparkles className="size-4" />
              Your academic corner at AASTU
            </div>
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

  const [showShare, setShowShare] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState("")

  const [shareCollege, setShareCollege] = useState("")
  const [shareDepartment, setShareDepartment] = useState("")
  const [shareYear, setShareYear] = useState("")
  const [shareSemester, setShareSemester] = useState("")
  const [shareCourse, setShareCourse] = useState("")
  const [shareType, setShareType] = useState("")
  const [shareDescription, setShareDescription] = useState("")
  const [shareFile, setShareFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setShareFile(f)
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const submitShare = async () => {
    setShareMsg("")
    const missing = [] as string[]
    if (!shareCollege) missing.push('college')
    if (!shareDepartment) missing.push('department')
    if (!shareYear) missing.push('year')
    if (!shareSemester) missing.push('semester')
    if (!shareCourse || !String(shareCourse).trim()) missing.push('course')
    if (!shareType) missing.push('type')
    if (!shareFile) missing.push('file')
    if (missing.length > 0) {
      setShareMsg(`Missing: ${missing.join(', ')}`)
      return
    }
    setShareLoading(true)
    try {
      // upload is required
      let fileMeta: { fileName: string; fileUrl: string; mimeType?: string } | null = null
      const fd = new FormData()
      fd.append('file', shareFile as Blob)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Upload failed')
      fileMeta = await up.json()
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college: shareCollege,
          department: shareDepartment,
          year: shareYear,
          semester: shareSemester,
          course: shareCourse,
          type: shareType,
          description: shareDescription,
          fileName: fileMeta?.fileName,
          fileUrl: fileMeta?.fileUrl,
          mimeType: fileMeta?.mimeType,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setShareMsg(data?.error || 'Could not add resource')
      } else {
        setShareMsg('Thanks — resource shared!')
        setShowShare(false)
        setShareCollege('')
        setShareDepartment('')
        setShareYear('')
        setShareSemester('')
        setShareCourse('')
        setShareType('')
        setShareDescription('')
        setShareFile(null)
        onSaved()
      }
    } catch (err) {
      setShareMsg('Could not add resource')
    } finally {
      setShareLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return
    try {
      const res = await fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.status === 204 || res.ok) {
        onSaved()
        return
      }
      const detail = await res.json().catch(() => null)
      alert(detail?.error || 'Could not delete resource')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete resource')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Resource library</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Find exactly what you need.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Start with your college and narrow your way to the right study material.</p>
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
          {department && <Step label="Year" value={year} options={years} onChange={(v) => choose("year", v)} />}
          {year && <Step label="Semester" value={semester} options={semesters} onChange={(v) => choose("semester", v)} />}
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
          <p className="mt-1 text-sm text-muted-foreground">{college ? `${filtered.length} resources matched your path` : 'Your library will appear here after you choose your academic path.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowShare(s => !s)}>Share a resource</Button>
        </div>
      </div>

      {showShare && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              College
              <select className="mt-1 block w-full" value={shareCollege} onChange={(e) => setShareCollege(e.target.value)}>
                <option value="">Choose college</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Department
              <select className="mt-1 block w-full" value={shareDepartment} onChange={(e) => setShareDepartment(e.target.value)}>
                <option value="">Choose department</option>
                {(departmentMap[shareCollege] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Year
              <select className="mt-1 block w-full" value={shareYear} onChange={(e) => setShareYear(e.target.value)}>
                <option value="">Choose year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Semester
              <select className="mt-1 block w-full" value={shareSemester} onChange={(e) => setShareSemester(e.target.value)}>
                <option value="">Choose semester</option>
                {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Course / Title
              <input className="mt-1 block w-full" value={shareCourse} onChange={(e) => setShareCourse(e.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              Type
              <select className="mt-1 block w-full" value={shareType} onChange={(e) => setShareType(e.target.value)}>
                <option value="">Choose type</option>
                {types.filter(t => t !== 'All types').map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Description (optional)
              <input className="mt-1 block w-full" value={shareDescription} onChange={(e) => setShareDescription(e.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              File (required)
              <div
                onDrop={onDropFile}
                onDragOver={onDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex h-28 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background text-sm text-muted-foreground"
              >
                {shareFile ? (
                  <div>{shareFile.name} ({Math.round(shareFile.size/1024)} KB)</div>
                ) : (
                  <div>Drop file here or click to choose</div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setShareFile(e.target.files ? e.target.files[0] : null)} />
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={submitShare} disabled={shareLoading}>{shareLoading ? 'Sharing…' : 'Share'}</Button>
            <Button variant="outline" onClick={() => setShowShare(false)}>Cancel</Button>
            {shareMsg && <span className="text-sm text-muted-foreground">{shareMsg}</span>}
          </div>
        </div>
      )}

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
            {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>
                {r.department} · {r.year}
              </span>
              <div className="flex items-center gap-3">
                {r.fileUrl && (
                  <a href={r.fileUrl} download className="text-xs underline hover:opacity-90">
                    Download
                  </a>
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
