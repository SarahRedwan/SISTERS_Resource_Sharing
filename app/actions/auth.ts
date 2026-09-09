"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const SignUpSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  college: z.string().min(1, "College required"),
  department: z.string().min(1, "Department required"),
  year: z.string().min(1, "Year required"),
  semester: z.string().min(1, "Semester required"),
})

const SignInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

export async function registerUser(formData: unknown) {
  const result = SignUpSchema.safeParse(formData)

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid form data" }
  }

  const { name, email, password, college, department, year, semester } = result.data

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: "An account with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        college,
        department,
        year,
        semester,
      },
    })

    return { success: true }
  } catch (err) {
    console.error("[registerUser] error:", err)
    return {
      error:
        err instanceof Error
          ? `Database error: ${err.message}`
          : "Database error: unknown",
    }
  }
}

export async function loginUser(formData: unknown) {
  const result = SignInSchema.safeParse(formData)

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid login data" }
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: "Incorrect email or password." }
  }

  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    return { error: "Incorrect email or password." }
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      college: user.college,
      department: user.department,
      year: user.year,
      semester: user.semester,
    },
  }
}