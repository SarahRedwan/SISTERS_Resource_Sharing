export type StudentProfile = {
  name: string
  email: string
  password: string
  college: string
  department: string
  year: string
  semester: string
}

export const colleges = ["Freshman", "Engineering", "Applied Science"]

export function normalizeCollegeName(college: string): string {
  const normalized = college.trim()

  if (normalized === "Pre Engineering" || normalized === "College of Engineering") return "Engineering"
  if (normalized === "Pre Applied" || normalized === "College of Applied Science") return "Applied Science"
  return normalized
}

export const departmentMap: Record<string, string[]> = {
  Freshman: ["General Freshman"],
  Engineering: [
    "Pre Engineering",
    "Architecture",
    "Civil Engineering",
    "Chemical Engineering",
    "Mechanical Engineering",
    "Electrical and Computer Engineering",
    "Electromechanical Engineering",
    "Software Engineering",
    "Environmental Engineering",
  ],
  "Applied Science": [
    "Pre Applied",
    "Industrial Chemistry",
    "Food Science and Applied Nutrition",
    "Geology",
    "Biotechnology",
  ],
}

export const years = ["Year 1"]
export const semesters = ["Semester 1"]

export function getAvailableYearsForCollege(college: string): string[] {
  if (!college) return years
  if (college === "Freshman") return ["Year 1"]
  return []
}

export function getAvailableSemestersForCollegeAndYear(college: string, year: string): string[] {
  if (!college) return []
  if (college === "Freshman" && year === "Year 1") return ["Semester 1"]
  return []
}

export function normalizeAcademicSelection(
  college: string,
  department: string,
  year: string,
  semester: string,
): { college: string; department: string; year: string; semester: string } {
  const nextCollege = normalizeCollegeName(college)
  const nextDepartment = nextCollege === "Freshman" ? "General Freshman" : department.trim()
  const yearOptions = getAvailableYearsForCollege(nextCollege)
  const nextYear = yearOptions.includes(year.trim()) ? year.trim() : yearOptions[0] || ""
  const semesterOptions = getAvailableSemestersForCollegeAndYear(nextCollege, nextYear)
  const nextSemester = semesterOptions.includes(semester.trim()) ? semester.trim() : semesterOptions[0] || ""

  return {
    college: nextCollege,
    department: nextDepartment,
    year: nextYear,
    semester: nextSemester,
  }
}

const USERS_KEY = "aastu_users"
const CURRENT_USER_KEY = "aastu_current_user"
const PROFILE_KEY = "aastu_student_profile"

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getStoredUsers(): StudentProfile[] {
  if (typeof window === "undefined") return []
  return parseJSON<StudentProfile[]>(localStorage.getItem(USERS_KEY), [])
}

export function writeStoredUsers(users: StudentProfile[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function setCurrentUser(email: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CURRENT_USER_KEY, email)
}

export function getCurrentUserEmail() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(CURRENT_USER_KEY) || ""
}

export function getCurrentStudentProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null

  const profile = parseJSON<StudentProfile | null>(localStorage.getItem(PROFILE_KEY), null)
  if (profile) {
    const normalizedProfile = {
      ...profile,
      college: normalizeCollegeName(profile.college),
      department: profile.department.trim(),
      year: profile.year.trim(),
      semester: profile.semester.trim(),
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile))
    return normalizedProfile
  }

  const email = getCurrentUserEmail()
  if (!email) return null

  const user = getStoredUsers().find((item) => item.email.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const normalizedUser = {
    ...user,
    college: normalizeCollegeName(user.college),
    department: user.department.trim(),
    year: user.year.trim(),
    semester: user.semester.trim(),
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedUser))
  return normalizedUser
}

export function saveStudentProfile(profile: StudentProfile) {
  if (typeof window === "undefined") return profile

  const normalizedProfile = {
    ...profile,
    college: normalizeCollegeName(profile.college),
    department: profile.department.trim(),
    year: profile.year.trim(),
    semester: profile.semester.trim(),
  }

  const users = getStoredUsers()
  const nextUsers = users.filter((user) => user.email.toLowerCase() !== normalizedProfile.email.toLowerCase())
  nextUsers.push(normalizedProfile)
  writeStoredUsers(nextUsers)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile))
  setCurrentUser(normalizedProfile.email)
  window.dispatchEvent(new Event("student-profile-updated"))
  return normalizedProfile
}

export function signUpStudent(profile: StudentProfile) {
  const normalizedProfile = {
    ...profile,
    name: profile.name.trim(),
    email: profile.email.trim(),
    college: normalizeCollegeName(profile.college),
    department: profile.department.trim(),
    year: profile.year.trim(),
    semester: profile.semester.trim(),
  }

  const users = getStoredUsers()
  if (users.some((user) => user.email.toLowerCase() === normalizedProfile.email.toLowerCase())) {
    throw new Error("An account with this email already exists.")
  }

  if (!normalizedProfile.name || !normalizedProfile.email || !normalizedProfile.password) {
    throw new Error("Please enter your full name, email, and password.")
  }

  if (!normalizedProfile.college || !normalizedProfile.department || !normalizedProfile.year || !normalizedProfile.semester) {
    throw new Error("Please complete your academic details.")
  }

  return saveStudentProfile(normalizedProfile)
}

export function signInStudent(email: string, password: string) {
  if (typeof window === "undefined") return null

  const user = getStoredUsers().find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
  )

  if (!user) return null

  const normalizedUser = {
    ...user,
    college: normalizeCollegeName(user.college),
    department: user.department.trim(),
    year: user.year.trim(),
    semester: user.semester.trim(),
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedUser))
  setCurrentUser(normalizedUser.email)
  window.dispatchEvent(new Event("student-profile-updated"))
  return normalizedUser
}

export function signOutStudent() {
  if (typeof window === "undefined") return
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem(PROFILE_KEY)
  window.dispatchEvent(new Event("student-profile-updated"))
}
