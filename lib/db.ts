import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { pool?: Pool }
export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool
export const db = drizzle(pool)

export type Resource = {
  id: string
  college: string
  department: string
  year: string
  semester: string
  course: string
  type: string
  createdAt: Date
}

export const resourceColumns = {
  id: 'id', college: 'college', department: 'department', year: 'year', semester: 'semester', course: 'course', type: 'type', createdAt: 'created_at',
} as const

export function mapResource(row: Record<string, unknown>): Resource {
  return { id: String(row.id), college: String(row.college), department: String(row.department), year: String(row.year), semester: String(row.semester), course: String(row.course), type: String(row.type), createdAt: new Date(String(row.created_at)) }
}

export const resourceSelect = 'id, college, department, year, semester, course, type, created_at'
